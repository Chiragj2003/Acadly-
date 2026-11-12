import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type Batch, type Subject } from '@/types/database';

export interface BatchStudentRow {
  id: string;
  batch_id: string;
  student_id: string;
  enrolled_at: string;
  student: {
    id: string;
    roll_number: string;
    class_grade: string;
    user: {
      id: string;
      full_name: string;
      email: string;
      avatar_url?: string;
      phone?: string;
    };
  };
}

/**
 * Fetch all batches for an institute.
 */
export const getBatches = async (instituteId: string): Promise<Batch[]> => {
  if (!isSupabaseConfigured || !instituteId) return [];

  const { data, error } = await supabase
    .from('batches')
    .select(`
      *,
      student_count:batch_students(count)
    `)
    .eq('institute_id', instituteId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load batches: ${error.message}`);
  }

  return (data || []).map((b: any) => ({
    ...b,
    student_count: b.student_count?.[0]?.count ?? 0,
  })) as Batch[];
};

/**
 * Fetch single batch by ID.
 */
export const getBatchById = async (batchId: string): Promise<Batch | null> => {
  if (!isSupabaseConfigured || !batchId) return null;

  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('id', batchId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch batch: ${error.message}`);
  }

  return data as Batch | null;
};

/**
 * Create a new batch in the database.
 */
export const createBatch = async (
  batchData: Omit<Batch, 'id' | 'created_at' | 'student_count'>
): Promise<Batch> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('batches')
    .insert({
      ...batchData,
      status: batchData.status || 'active',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create batch: ${error.message}`);
  }

  return { ...data, student_count: 0 } as Batch;
};

/**
 * Fetch all enrolled students for a specific batch.
 */
export const getBatchStudents = async (batchId: string): Promise<BatchStudentRow[]> => {
  if (!isSupabaseConfigured || !batchId) return [];

  const { data, error } = await supabase
    .from('batch_students')
    .select(`
      id,
      batch_id,
      student_id,
      enrolled_at,
      student:students(
        id,
        roll_number,
        class_grade,
        user:profiles(
          id,
          full_name,
          email,
          avatar_url,
          phone
        )
      )
    `)
    .eq('batch_id', batchId)
    .eq('status', 'active');

  if (error) {
    throw new Error(`Failed to load batch students: ${error.message}`);
  }

  return (data || []) as unknown as BatchStudentRow[];
};

/**
 * Fetch institute academic subjects.
 */
export const getSubjects = async (instituteId: string): Promise<Subject[]> => {
  if (!isSupabaseConfigured || !instituteId) return [];

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('institute_id', instituteId)
    .order('name');

  if (error) {
    throw new Error(`Failed to load subjects: ${error.message}`);
  }

  return (data || []) as Subject[];
};
