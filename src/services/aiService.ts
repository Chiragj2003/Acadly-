import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type InteractiveQuestion } from '@/components/academic/InteractiveDppBuilderModal';

export interface GenerateQuizDraftInput {
  notesText?: string;
  topic?: string;
  count?: number;
  pdfBase64?: string;
  batchId?: string;
}

export interface GenerateQuizDraftResponse {
  success: boolean;
  isDraft: boolean;
  questions: InteractiveQuestion[];
  modelUsed?: string;
  quotaRemaining?: number | null;
}

export interface GradeSubmissionWithAiInput {
  submissionId: string;
  referenceAnswer?: string;
  rubric?: string;
  submissionImageBase64?: string;
}

export interface GradeSubmissionWithAiResponse {
  success: boolean;
  submissionId: string;
  aiScore: number;
  maxScore: number;
  aiFeedback: string;
  strengths?: string[];
  areasForImprovement?: string[];
  aiStatus: string;
  quotaRemaining?: number | null;
}

export interface TeacherAiQuota {
  date: string;
  used: number;
  limit: number;
  remaining: number;
}

/**
 * Generate draft MCQs from teacher lecture notes or uploaded curriculum sheet.
 * Always returns a DRAFT for teacher review and editing.
 */
export async function generateQuizDraft(
  input: GenerateQuizDraftInput
): Promise<GenerateQuizDraftResponse> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.functions.invoke('generate-quiz', {
    body: input,
  });

  if (error) {
    throw new Error(error.message || 'Failed to generate quiz draft with Gemini');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    success: true,
    isDraft: true,
    questions: (data.questions || []).map((q: any) => ({
      id: q.id || `draft-q-${Date.now()}`,
      type: 'mcq' as const,
      questionText: q.questionText,
      options: q.options || [],
      correctOptionIndex: Number(q.correctOptionIndex) || 0,
      marks: Number(q.marks) || 4,
      explanation: q.explanation || '',
    })),
    modelUsed: data.modelUsed,
    quotaRemaining: data.quotaRemaining,
  };
}

/**
 * Request Gemini AI grading suggestion for a written student homework submission.
 * Saves suggestion in database as 'pending_review' until approved by teacher.
 */
export async function gradeSubmissionWithAI(
  input: GradeSubmissionWithAiInput
): Promise<GradeSubmissionWithAiResponse> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.functions.invoke('grade-submission', {
    body: input,
  });

  if (error) {
    throw new Error(error.message || 'Failed to grade submission with Gemini');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    success: true,
    submissionId: data.submissionId,
    aiScore: Number(data.aiScore),
    maxScore: Number(data.maxScore) || 25,
    aiFeedback: data.aiFeedback,
    strengths: data.strengths || [],
    areasForImprovement: data.areasForImprovement || [],
    aiStatus: data.aiStatus || 'pending_review',
    quotaRemaining: data.quotaRemaining,
  };
}

/**
 * Retrieve current teacher's daily AI usage quota (e.g., 25 calls/day).
 */
export async function getTeacherAiQuota(
  teacherId: string
): Promise<TeacherAiQuota> {
  if (!isSupabaseConfigured || !teacherId) {
    return {
      date: new Date().toISOString().split('T')[0],
      used: 0,
      limit: 25,
      remaining: 25,
    };
  }

  const { data, error } = await supabase.rpc('get_teacher_ai_quota', {
    p_teacher_id: teacherId,
  });

  if (error) {
    throw new Error(`Failed to fetch AI quota: ${error.message}`);
  }

  const res = data as any;
  return {
    date: res.date,
    used: Number(res.used) || 0,
    limit: Number(res.limit) || 25,
    remaining: Number(res.remaining) || 25,
  };
}
