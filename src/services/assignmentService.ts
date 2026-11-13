import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { prepareMemorySafeUpload } from '@/lib/fileUploadHelper';
import { type Assignment } from '@/types/database';

/**
 * Fetch all assignments for a batch.
 */
export const getAssignments = async (batchId: string): Promise<Assignment[]> => {
  if (!isSupabaseConfigured || !batchId) return [];

  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('batch_id', batchId)
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to load assignments: ${error.message}`);
  }

  return (data || []) as Assignment[];
};

/**
 * Fetch single assignment with question details.
 */
export const getAssignmentById = async (assignmentId: string): Promise<Assignment | null> => {
  if (!isSupabaseConfigured || !assignmentId) return null;

  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch assignment: ${error.message}`);
  }

  return data as Assignment | null;
};

/**
 * Create a new assignment for a batch.
 * For quiz assignments:
 * - Sanitizes questions stored in public.assignments so answers are not exposed to students
 * - Persists secret answer keys to isolated quiz_answer_keys table (teacher/admin RLS only)
 */
export const createAssignment = async (
  assignmentData: Omit<Assignment, 'id' | 'created_at'>
): Promise<Assignment> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const rawQuestions = Array.isArray(assignmentData.questions) ? assignmentData.questions : [];
  const isQuiz = assignmentData.type === 'quiz';

  // For quiz assignments, sanitize student-facing questions stored in assignments table
  const sanitizedQuestions = isQuiz
    ? rawQuestions.map((q: any) => ({
        id: q.id,
        type: q.type,
        questionText: q.questionText,
        options: q.options || [],
        marks: q.marks || 1,
        // Exclude correctOptionIndex and expectedAnswerText from public questions column
      }))
    : rawQuestions;

  const { data, error } = await supabase
    .from('assignments')
    .insert({
      ...assignmentData,
      questions: sanitizedQuestions,
      type: assignmentData.type || 'file',
      total_marks: assignmentData.total_marks || 100,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create assignment: ${error.message}`);
  }

  // If quiz, store secret answer keys in isolated quiz_answer_keys table
  if (isQuiz && rawQuestions.length > 0 && data?.id) {
    try {
      await supabase.from('quiz_answer_keys').insert({
        assignment_id: data.id,
        institute_id: assignmentData.institute_id,
        answer_keys: rawQuestions,
      });
    } catch (keyErr) {
      console.warn('[AssignmentService] Note: quiz_answer_keys insert skipped or failed:', keyErr);
    }
  }

  return data as Assignment;
};

/**
 * Upload assignment question paper/document attachment.
 */
export const uploadAssignmentAttachment = async (
  fileUri: string,
  fileName: string
): Promise<{ storagePath: string }> => {
  if (!isSupabaseConfigured) {
    return { storagePath: `assignments/${fileName}` };
  }

  const { blob, contentType } = await prepareMemorySafeUpload(
    fileUri,
    fileName,
    'application/pdf'
  );

  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `assignments/${Date.now()}_${sanitized}`;

  const { error } = await supabase.storage
    .from('study-materials')
    .upload(storagePath, blob, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload attachment: ${error.message}`);
  }

  return { storagePath };
};
