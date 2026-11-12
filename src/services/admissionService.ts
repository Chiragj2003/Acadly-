import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { generateUUID } from '@/lib/devSeedHelper';

export interface StudentExtraDetails {
  fullName: string;
  grade: string;
  board: string;
  targetExam: string;
  school: string;
  previousPercentage: string;
  weakSubjects: string[];
  guardianName: string;
  guardianPhone: string;
  bloodGroup: string;
  address?: string;
}

export interface JoinRequestRow {
  id: string;
  institute_id: string;
  user_id: string;
  student_id?: string;
  teacher_code?: string;
  target_type: string;
  student_details: StudentExtraDetails;
  status: 'pending' | 'approved' | 'rejected';
  assigned_batch_id?: string;
  assigned_fee_plan?: string;
  rejection_reason?: string;
  applied_at: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface SubmitJoinRequestInput {
  instituteId: string;
  userId: string;
  teacherCode: string;
  targetType?: string;
  studentDetails: StudentExtraDetails;
}

export interface ApproveJoinRequestInput {
  requestId: string;
  batchId: string;
  feePlan?: string;
  reviewerId: string;
}

export interface RejectJoinRequestInput {
  requestId: string;
  reason: string;
  reviewerId: string;
}

/**
 * Submit an admission join request for a student into an institute.
 */
export const submitJoinRequest = async (
  input: SubmitJoinRequestInput
): Promise<{ success: boolean; requestId: string; error?: string }> => {
  if (!isSupabaseConfigured) {
    return { success: true, requestId: generateUUID() };
  }

  const { instituteId, userId, teacherCode, targetType = 'coaching_center', studentDetails } = input;

  const { data, error } = await supabase
    .from('join_requests')
    .insert({
      institute_id: instituteId,
      user_id: userId,
      teacher_code: teacherCode.trim().toUpperCase(),
      target_type: targetType,
      student_details: studentDetails,
      status: 'pending',
      applied_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to submit join request: ${error.message}`);
  }

  return { success: true, requestId: data.id };
};

/**
 * Fetch pending join requests for an institute.
 */
export const getPendingJoinRequests = async (
  instituteId: string
): Promise<JoinRequestRow[]> => {
  if (!isSupabaseConfigured || !instituteId) return [];

  const { data, error } = await supabase
    .from('join_requests')
    .select(`
      *,
      user:profiles!join_requests_user_id_fkey(full_name, email, avatar_url)
    `)
    .eq('institute_id', instituteId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch join requests: ${error.message}`);
  }

  return (data || []) as JoinRequestRow[];
};

/**
 * Approve a join request:
 * - Creates/updates the student record in public.students
 * - Enrolls student in public.batch_students with batchId (UUID)
 * - Sets status = 'approved' on join_requests
 * - Sends approval notification to student
 */
export const approveJoinRequest = async (
  input: ApproveJoinRequestInput
): Promise<{ success: boolean }> => {
  const { requestId, batchId, feePlan, reviewerId } = input;

  if (!isSupabaseConfigured) {
    return { success: true };
  }

  // 1. Fetch the request details
  const { data: request, error: reqError } = await supabase
    .from('join_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (reqError || !request) {
    throw new Error(`Join request not found: ${reqError?.message}`);
  }

  const details = (request.student_details || {}) as StudentExtraDetails;
  const targetUserId = request.user_id;
  const instituteId = request.institute_id;

  // 2. Upsert student record
  const rollNumber = `#${Math.floor(100 + Math.random() * 900)}`;
  const parentLinkCode = `STU-${(details.fullName || 'STU').substring(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const { data: studentRecord, error: stuError } = await supabase
    .from('students')
    .upsert(
      {
        institute_id: instituteId,
        user_id: targetUserId,
        roll_number: rollNumber,
        admission_number: rollNumber,
        parent_link_code: parentLinkCode,
        class_grade: details.grade || 'Class 12',
        grade: details.grade || 'Class 12',
        board: details.board || 'CBSE',
        target_exam: details.targetExam || 'Competitive Exam',
        school_or_college: details.school || 'School',
        school_name: details.school || 'School',
        guardian_name: details.guardianName || 'Guardian',
        guardian_phone: details.guardianPhone || '',
        blood_group: details.bloodGroup || 'O+',
        previous_percentage: details.previousPercentage || '',
        weak_subjects: details.weakSubjects || [],
      },
      { onConflict: 'institute_id,user_id' }
    )
    .select('id')
    .single();

  if (stuError || !studentRecord) {
    throw new Error(`Failed to create student record: ${stuError?.message}`);
  }

  const studentId = studentRecord.id;

  // 3. Insert enrollment in batch_students (UUID batchId)
  const { error: batchError } = await supabase.from('batch_students').upsert(
    {
      batch_id: batchId,
      student_id: studentId,
      status: 'active',
    },
    { onConflict: 'batch_id,student_id' }
  );

  if (batchError) {
    throw new Error(`Failed to assign student to batch: ${batchError.message}`);
  }

  // 4. Update join_requests record
  const { error: updateError } = await supabase
    .from('join_requests')
    .update({
      status: 'approved',
      assigned_batch_id: batchId,
      assigned_fee_plan: feePlan || 'Standard',
      student_id: studentId,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) {
    throw new Error(`Failed to update join request status: ${updateError.message}`);
  }

  // 5. Notify the student
  await supabase.from('notifications').insert({
    user_id: targetUserId,
    title: 'Admission Approved!',
    body: 'Your enrollment request has been approved. You can now access your classroom batch, DPPs, and lectures.',
    data: { batch_id: batchId, student_id: studentId },
  });

  supabase.functions
    .invoke('send-push-notifications', {
      body: {
        instituteId,
        userIds: [targetUserId],
        title: 'Admission Approved!',
        body: 'Your enrollment request has been approved. You can now access your classroom batch, DPPs, and lectures.',
        type: 'admission_decision',
        data: { batch_id: batchId, student_id: studentId, status: 'approved' },
      },
    })
    .catch(() => null);

  return { success: true };
};

/**
 * Reject a join request with a documented reason.
 */
export const rejectJoinRequest = async (
  input: RejectJoinRequestInput
): Promise<{ success: boolean }> => {
  const { requestId, reason, reviewerId } = input;

  if (!isSupabaseConfigured) {
    return { success: true };
  }

  const { data: request } = await supabase
    .from('join_requests')
    .select('user_id')
    .eq('id', requestId)
    .single();

  const { error } = await supabase
    .from('join_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim(),
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    throw new Error(`Failed to reject join request: ${error.message}`);
  }

  if (request?.user_id) {
    await supabase.from('notifications').insert({
      user_id: request.user_id,
      title: 'Admission Application Update',
      body: `Your request could not be approved at this time. Reason: ${reason}`,
      data: { request_id: requestId, reason },
    });

    supabase.functions
      .invoke('send-push-notifications', {
        body: {
          instituteId: 'a0000000-0000-0000-0000-000000000001',
          userIds: [request.user_id],
          title: 'Admission Application Update',
          body: `Your request could not be approved at this time. Reason: ${reason}`,
          type: 'admission_decision',
          data: { request_id: requestId, reason, status: 'rejected' },
        },
      })
      .catch(() => null);
  }

  return { success: true };
};
