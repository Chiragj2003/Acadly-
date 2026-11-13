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
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  assigned_batch_id?: string;
  assigned_fee_plan?: string;
  rejection_reason?: string;
  waitlist_reason?: string;
  reapplied_at?: string;
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
  reviewerId?: string;
}

export interface WaitlistJoinRequestInput {
  requestId: string;
  reason: string;
  reviewerId?: string;
}

export interface ReapplyJoinRequestInput {
  requestId: string;
  studentDetails: StudentExtraDetails;
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

  let { instituteId, userId, teacherCode, targetType = 'coaching_center', studentDetails } = input;

  // If instituteId is missing or placeholder, resolve dynamically via RPC
  if (!instituteId || instituteId.startsWith('a0000000') || !instituteId.includes('-')) {
    try {
      const { data: instData } = await supabase.rpc('lookup_institute_by_code', {
        p_code: teacherCode.trim().toUpperCase(),
      });
      if (instData && typeof instData === 'object' && 'id' in (instData as any)) {
        instituteId = (instData as any).id;
      }
    } catch {
      // Fall through to standard submission
    }
  }

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
 * Approve a join request atomically in ONE transaction via SECURITY DEFINER RPC.
 * - Verifies caller permission
 * - Creates/updates student record in public.students
 * - Enrolls student in public.batch_students
 * - Updates institute membership
 * - Updates join_requests to 'approved'
 * - Dispatches notification in public.notifications
 */
export const approveJoinRequest = async (
  input: ApproveJoinRequestInput
): Promise<{ success: boolean }> => {
  const { requestId, batchId } = input;

  if (!isSupabaseConfigured) {
    return { success: true };
  }

  const { data, error } = await supabase.rpc('approve_join_request', {
    p_request_id: requestId,
    p_batch_id: batchId,
  });

  if (error) {
    throw new Error(`Failed to approve join request: ${error.message}`);
  }

  return { success: true };
};

/**
 * Reject a join request with a documented reason via atomic SECURITY DEFINER RPC.
 */
export const rejectJoinRequest = async (
  input: RejectJoinRequestInput
): Promise<{ success: boolean; status?: string; reason?: string }> => {
  const { requestId, reason } = input;

  if (!isSupabaseConfigured) {
    return { success: true, status: 'rejected', reason };
  }

  const { data, error } = await supabase.rpc('reject_join_request', {
    p_request_id: requestId,
    p_reason: reason.trim(),
  });

  if (error) {
    throw new Error(`Failed to reject join request: ${error.message}`);
  }

  return { success: true, ...(data as Record<string, unknown>) };
};

/**
 * Waitlist a join request with a documented reason via atomic SECURITY DEFINER RPC.
 */
export const waitlistJoinRequest = async (
  input: WaitlistJoinRequestInput
): Promise<{ success: boolean; status?: string; reason?: string }> => {
  const { requestId, reason } = input;

  if (!isSupabaseConfigured) {
    return { success: true, status: 'waitlisted', reason };
  }

  const { data, error } = await supabase.rpc('waitlist_join_request', {
    p_request_id: requestId,
    p_reason: reason.trim(),
  });

  if (error) {
    throw new Error(`Failed to waitlist join request: ${error.message}`);
  }

  return { success: true, ...(data as Record<string, unknown>) };
};

/**
 * Student edits details and resubmits their application via atomic SECURITY DEFINER RPC.
 */
export const reapplyJoinRequest = async (
  input: ReapplyJoinRequestInput
): Promise<{ success: boolean; status?: string }> => {
  const { requestId, studentDetails } = input;

  if (!isSupabaseConfigured) {
    return { success: true, status: 'pending' };
  }

  const { data, error } = await supabase.rpc('reapply_join_request', {
    p_request_id: requestId,
    p_updated_details: studentDetails as unknown as Record<string, unknown>,
  });

  if (error) {
    throw new Error(`Failed to reapply join request: ${error.message}`);
  }

  return { success: true, ...(data as Record<string, unknown>) };
};

/**
 * Fetch the latest join request for a specific user to display admission state.
 */
export const getUserLatestJoinRequest = async (
  userId: string
): Promise<JoinRequestRow | null> => {
  if (!isSupabaseConfigured || !userId) return null;

  const { data, error } = await supabase
    .from('join_requests')
    .select(`
      *,
      user:profiles!join_requests_user_id_fkey(full_name, email, avatar_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user join request: ${error.message}`);
  }

  return data as JoinRequestRow | null;
};
