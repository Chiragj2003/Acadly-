import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { prepareMemorySafeUpload } from '@/lib/fileUploadHelper';
import { base64ToArrayBuffer } from '@/services/materialService';
import { type Submission } from '@/types/database';

export interface SubmitHomeworkInput {
  assignmentId: string;
  studentId: string;
  notes?: string;
  fileUri?: string;
  fileName?: string;
  answers?: Record<string, unknown>;
}

export interface GradeSubmissionInput {
  submissionId: string;
  marks: number;
  feedback: string;
  graderId: string;
}

/**
 * Fetch all submissions for an assignment.
 */
export const getSubmissionsForAssignment = async (
  assignmentId: string
): Promise<Submission[]> => {
  if (!isSupabaseConfigured || !assignmentId) return [];

  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      student:students(
        id,
        roll_number,
        user:profiles(full_name, email, avatar_url)
      )
    `)
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load submissions: ${error.message}`);
  }

  return (data || []).map((s: any) => ({
    ...s,
    student_name: s.student?.user?.full_name || 'Student',
    roll_number: s.student?.roll_number || '',
  })) as Submission[];
};

/**
 * Fetch all submissions for every assignment in a batch (teacher grading inbox).
 */
export const getSubmissionsForBatch = async (batchId: string): Promise<Submission[]> => {
  if (!isSupabaseConfigured || !batchId) return [];

  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      assignment:assignments!inner(id, batch_id, title),
      student:students(
        id,
        roll_number,
        user:profiles(full_name, email, avatar_url)
      )
    `)
    .eq('assignment.batch_id', batchId)
    .order('submitted_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load batch submissions: ${error.message}`);
  }

  type Row = Submission & { student?: { roll_number?: string; user?: { full_name?: string } } };
  return ((data || []) as unknown as Row[]).map((s) => ({
    ...s,
    student_name: s.student?.user?.full_name || 'Student',
    roll_number: s.student?.roll_number || '',
  })) as Submission[];
};

/**
 * Fetch a specific student's submission for an assignment.
 */
export const getStudentSubmission = async (
  assignmentId: string,
  studentId: string
): Promise<Submission | null> => {
  if (!isSupabaseConfigured || !assignmentId || !studentId) return null;

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch student submission: ${error.message}`);
  }

  return data as Submission | null;
};

/**
 * Submit student homework:
 * - If fileUri is provided, reads via expo-file-system and uploads to 'student-submissions'
 * - Upserts submissions row in database
 */
export const submitHomework = async (
  input: SubmitHomeworkInput
): Promise<Submission> => {
  const { assignmentId, studentId, notes, fileUri, fileName, answers = {} } = input;

  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  let storagePath: string | null = null;
  let cleanFileName: string | null = null;

  if (fileUri && fileName) {
    cleanFileName = fileName;

    // Polyfill Bare atob (BUG-016): convert base64 safely via base64ToArrayBuffer if data-URI is provided
    let uploadBlob: Blob;
    let uploadContentType = 'application/pdf';

    if (fileUri.startsWith('data:')) {
      const arrayBuffer = base64ToArrayBuffer(fileUri);
      uploadContentType = fileUri.split(';')[0].replace('data:', '') || 'application/pdf';
      uploadBlob = new Blob([arrayBuffer.buffer as ArrayBuffer], { type: uploadContentType });
    } else {
      const prepared = await prepareMemorySafeUpload(
        fileUri,
        fileName,
        'application/pdf'
      );
      uploadBlob = prepared.blob;
      uploadContentType = prepared.contentType;
    }

    const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    storagePath = `${assignmentId}/${studentId}_${Date.now()}_${sanitized}`;

    const { error: uploadError } = await supabase.storage
      .from('student-submissions')
      .upload(storagePath, uploadBlob, {
        contentType: uploadContentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload submission file: ${uploadError.message}`);
    }
  }

  const { data, error } = await supabase
    .from('submissions')
    .upsert(
      {
        assignment_id: assignmentId,
        student_id: studentId,
        file_url: storagePath,
        file_name: cleanFileName,
        notes: notes || 'Student Solution Document',
        answers,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'assignment_id,student_id' }
    )
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to submit assignment: ${error.message}`);
  }

  return data as Submission;
};

/**
 * Grade student homework submission:
 * - Fetches assignment's total_marks to clamp score: 0 <= marks <= total_marks
 * - Updates submissions row with score, feedback, graded_at, graded_by
 * - Notifies student of graded result
 */
export const gradeSubmission = async (
  input: GradeSubmissionInput
): Promise<{ success: boolean; score: number }> => {
  const { submissionId, marks, feedback, graderId } = input;

  if (!isSupabaseConfigured) {
    return { success: true, score: marks };
  }

  // 1. Fetch submission and its assignment to determine max marks
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .select(`
      id,
      assignment_id,
      student_id,
      assignment:assignments(total_marks, title),
      student:students(user_id)
    `)
    .eq('id', submissionId)
    .single();

  if (subError || !submission) {
    throw new Error(`Submission not found: ${subError?.message}`);
  }

  const totalMarks = (submission as any)?.assignment?.total_marks ?? 100;
  const assignmentTitle = (submission as any)?.assignment?.title ?? 'Assignment';
  const studentUserId = (submission as any)?.student?.user_id;

  // Clamp marks between 0 and assignment's total_marks
  const clampedScore = Math.max(0, Math.min(marks, totalMarks));

  // 2. Update submission
  const { error: updateError } = await supabase
    .from('submissions')
    .update({
      score: clampedScore,
      feedback: feedback.trim(),
      status: 'graded',
      ai_status: 'approved',
      graded_at: new Date().toISOString(),
      graded_by: graderId,
    })
    .eq('id', submissionId);

  if (updateError) {
    throw new Error(`Failed to save grade: ${updateError.message}`);
  }

  // 3. Notify student
  if (studentUserId) {
    await supabase.from('notifications').insert({
      user_id: studentUserId,
      title: 'Homework Evaluated',
      body: `Your submission for "${assignmentTitle}" has been graded: ${clampedScore}/${totalMarks}. Feedback: ${feedback}`,
      data: { submission_id: submissionId, score: clampedScore, total_marks: totalMarks },
    });

    supabase.functions
      .invoke('send-push-notifications', {
        body: {
          instituteId: (submission as any)?.institute_id || 'a0000000-0000-0000-0000-000000000001',
          userIds: [studentUserId],
          title: 'Homework Evaluated',
          body: `Your submission for "${assignmentTitle}" has been graded: ${clampedScore}/${totalMarks}.`,
          type: 'grade_posted',
          data: { submission_id: submissionId, score: clampedScore, total_marks: totalMarks },
        },
      })
      .catch(() => null);
  }

  return { success: true, score: clampedScore };
};

export interface QuizResultQuestion {
  id: string;
  type: string;
  questionText: string;
  options?: string[];
  studentAnswer: any;
  correctOptionIndex?: number;
  expectedAnswerText?: string;
  isCorrect: boolean | null;
  marksObtained: number;
  maxMarks: number;
  explanation?: string;
}

export interface QuizSubmissionResult {
  submissionId: string;
  totalScore: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  status: 'graded' | 'submitted';
  questions: QuizResultQuestion[];
}

export interface QuestionAnalyticsItem {
  questionId: string;
  questionText: string;
  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;
  percentCorrect: number;
}

export interface QuizAnalyticsSummary {
  assignmentId: string;
  assignmentTitle: string;
  totalStudents: number;
  submittedCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  questions: QuestionAnalyticsItem[];
}

/**
 * Fetch assignment for taking a quiz.
 * Calls SECURITY DEFINER RPC get_quiz_for_student which strips correct answers and explanations on the server.
 */
export const getAssignmentForTaking = async (assignmentId: string): Promise<any | null> => {
  if (!isSupabaseConfigured || !assignmentId) return null;

  const { data, error } = await supabase.rpc('get_quiz_for_student', {
    p_assignment_id: assignmentId,
  });

  if (error || !data) {
    // Fallback query if RPC unavailable
    const { data: rawAsg, error: rawErr } = await supabase
      .from('assignments')
      .select('id, institute_id, batch_id, title, description, subject, type, total_marks, due_date, questions')
      .eq('id', assignmentId)
      .single();

    if (rawErr || !rawAsg) {
      throw new Error(`Failed to load quiz: ${error?.message || rawErr?.message || 'Not found'}`);
    }

    const rawQuestions = Array.isArray(rawAsg.questions) ? rawAsg.questions : [];
    const sanitized = rawQuestions.map((q: any) => ({
      id: q.id,
      type: q.type,
      questionText: q.questionText,
      options: q.options || [],
      marks: q.marks || 1,
    }));

    return {
      ...rawAsg,
      questions: sanitized,
    };
  }

  return data;
};

/**
 * Submit and auto-grade interactive DPP / quiz.
 * Evaluated strictly server-side via SECURITY DEFINER RPC submit_and_grade_quiz (SEC-008).
 * Compares student answers against master questions, calculates total score, and persists grade.
 * Students cannot directly set or modify score, graded_at, or feedback.
 */
export const submitQuiz = async (input: {
  assignmentId: string;
  studentId: string;
  instituteId?: string;
  answers: Record<string, any>;
}): Promise<QuizSubmissionResult> => {
  const { assignmentId, studentId, answers } = input;

  if (!isSupabaseConfigured) {
    return {
      submissionId: 'mock-sub-id',
      totalScore: 8,
      totalMarks: 10,
      percentage: 80,
      isPassed: true,
      status: 'graded',
      questions: [],
    };
  }

  // 1. Primary: Server-side secure evaluation via submit_and_grade_quiz RPC (SEC-008)
  let rpcData: any = null;
  let rpcError: any = null;

  const res = await supabase.rpc('submit_and_grade_quiz', {
    p_assignment_id: assignmentId,
    p_student_id: studentId,
    p_student_answers: answers,
  });

  rpcData = res.data;
  rpcError = res.error;

  // Fallback to submit_quiz RPC if submit_and_grade_quiz is not found
  if (rpcError && rpcError.message && (rpcError.message.includes('not found') || rpcError.code === '42883')) {
    const fallbackRes = await supabase.rpc('submit_quiz', {
      p_assignment_id: assignmentId,
      p_answers: answers,
    });
    rpcData = fallbackRes.data;
    rpcError = fallbackRes.error;
  }

  if (rpcError) {
    throw new Error(`Failed to submit quiz: ${rpcError.message}`);
  }

  if (rpcData && typeof rpcData === 'object') {
    const raw = rpcData as any;
    const questionsArray = Array.isArray(raw.questions)
      ? raw.questions
      : Array.isArray(raw.details)
      ? raw.details
      : [];

    return {
      submissionId: raw.submissionId || raw.submission_id || 'sub-graded',
      totalScore: Number(raw.totalScore ?? raw.score) || 0,
      totalMarks: Number(raw.totalMarks ?? raw.total_marks) || 0,
      percentage: Number(raw.percentage) || 0,
      isPassed: Boolean(raw.isPassed ?? raw.is_passed),
      status: 'graded',
      questions: questionsArray.map((d: any) => ({
        id: d.id,
        type: d.type || 'mcq',
        questionText: d.questionText || '',
        studentAnswer: d.studentAnswer,
        correctOptionIndex: d.correctOptionIndex,
        expectedAnswerText: d.expectedAnswerText,
        isCorrect: d.isCorrect,
        marksObtained: Number(d.marksObtained) || 0,
        maxMarks: Number(d.maxMarks) || 1,
        explanation: d.explanation,
      })),
    };
  }

  throw new Error('Unexpected empty response from quiz grading RPC');
};

/**
 * Fetch Quiz Analytics for teacher view (per-student and per-question breakdown).
 */
export const getQuizAnalytics = async (
  assignmentId: string
): Promise<QuizAnalyticsSummary | null> => {
  if (!isSupabaseConfigured || !assignmentId) return null;

  const { data: assignment, error: asgError } = await supabase
    .from('assignments')
    .select('id, title, total_marks, questions')
    .eq('id', assignmentId)
    .single();

  if (asgError || !assignment) return null;

  const { data: submissions = [] } = await supabase
    .from('submissions')
    .select('id, student_id, score, answers, status')
    .eq('assignment_id', assignmentId);

  const subList = (submissions || []) as {
    id: string;
    student_id: string;
    score: number | null;
    answers: Record<string, unknown> | null;
    status: string;
  }[];
  const submittedCount = subList.length;
  const questions = (Array.isArray(assignment.questions) ? assignment.questions : []) as {
    id: string;
    questionText?: string;
    correctOptionIndex?: number;
    [key: string]: unknown;
  }[];

  let totalScoreSum = 0;
  let highest = 0;
  let lowest = Number(assignment.total_marks) || 100;
  let passCount = 0;

  subList.forEach((s) => {
    const sc = Number(s.score) || 0;
    totalScoreSum += sc;
    if (sc > highest) highest = sc;
    if (sc < lowest) lowest = sc;
    const maxM = Number(assignment.total_marks) || 100;
    if (maxM > 0 && (sc / maxM) >= 0.4) passCount++;
  });

  const averageScore = submittedCount > 0 ? Math.round((totalScoreSum / submittedCount) * 10) / 10 : 0;
  const passRate = submittedCount > 0 ? Math.round((passCount / submittedCount) * 100) : 0;

  const questionAnalytics: QuestionAnalyticsItem[] = questions.map((q) => {
    let correct = 0;
    let incorrect = 0;

    subList.forEach((s) => {
      const studentAns = (s.answers as Record<string, unknown> | null)?.[q.id];
      if (studentAns !== undefined) {
        if (Number(studentAns) === Number(q.correctOptionIndex)) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    const totalAttempts = correct + incorrect;
    const percentCorrect = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;

    return {
      questionId: q.id,
      questionText: String(q.questionText || ''),
      totalAttempts,
      correctCount: correct,
      incorrectCount: incorrect,
      percentCorrect,
    };
  });

  return {
    assignmentId,
    assignmentTitle: assignment.title,
    totalStudents: submittedCount,
    submittedCount,
    averageScore,
    highestScore: submittedCount > 0 ? highest : 0,
    lowestScore: submittedCount > 0 ? lowest : 0,
    passRate,
    questions: questionAnalytics,
  };
};

/**
 * Submit written homework (PDF documents or photos) via atomic SECURITY DEFINER RPC submit_written_homework.
 * Enforces deadlines, maximum attempts, and sets is_late flag.
 */
export const submitWrittenHomework = async (input: {
  assignmentId: string;
  fileUrls: string[];
  submissionText?: string;
}): Promise<{
  success: boolean;
  submissionId: string;
  status: string;
  isLate: boolean;
  attemptNumber: number;
}> => {
  const { assignmentId, fileUrls, submissionText = '' } = input;

  if (!isSupabaseConfigured) {
    return {
      success: true,
      submissionId: 'mock-written-sub',
      status: 'submitted',
      isLate: false,
      attemptNumber: 1,
    };
  }

  const { data, error } = await supabase.rpc('submit_written_homework', {
    p_assignment_id: assignmentId,
    p_file_urls: fileUrls as unknown as Record<string, unknown>,
    p_submission_text: submissionText,
  });

  if (error) {
    throw new Error(`Failed to submit written homework: ${error.message}`);
  }

  const res = data as any;
  return {
    success: true,
    submissionId: res.submission_id,
    status: res.status || 'submitted',
    isLate: Boolean(res.is_late),
    attemptNumber: Number(res.attempt_number) || 1,
  };
};

/**
 * Grade or Return a written homework submission via atomic SECURITY DEFINER RPC grade_written_submission.
 * Faculty can post score and feedback, or return to student for rework.
 */
export const gradeWrittenSubmission = async (input: {
  submissionId: string;
  score: number;
  feedback: string;
  returnForRework?: boolean;
}): Promise<{
  success: boolean;
  submissionId: string;
  status: string;
  score: number;
  feedback: string;
}> => {
  const { submissionId, score, feedback, returnForRework = false } = input;

  if (!isSupabaseConfigured) {
    return {
      success: true,
      submissionId,
      status: returnForRework ? 'returned' : 'graded',
      score,
      feedback,
    };
  }

  const { data, error } = await supabase.rpc('grade_written_submission', {
    p_submission_id: submissionId,
    p_score: score,
    p_feedback: feedback.trim(),
    p_return_for_rework: returnForRework,
  });

  if (error) {
    throw new Error(`Failed to grade submission: ${error.message}`);
  }

  const res = data as any;
  return {
    success: true,
    submissionId: res.submission_id,
    status: res.status,
    score: Number(res.score),
    feedback: res.feedback,
  };
};

