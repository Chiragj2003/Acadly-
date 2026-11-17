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
      // batches.status CHECK allows in_progress | upcoming | completed | archived.
      status: batchData.status || 'in_progress',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create batch: ${error.message}`);
  }

  return { ...data, student_count: 0 } as Batch;
};

export interface StudentEnrollment {
  batch_id: string;
  batch_name: string;
}

/**
 * Fetch the batches a student (students.id) is currently enrolled in.
 */
export const getStudentEnrollments = async (studentId: string): Promise<StudentEnrollment[]> => {
  if (!isSupabaseConfigured || !studentId) return [];

  const { data, error } = await supabase
    .from('batch_students')
    .select('batch_id, batch:batches(name)')
    .eq('student_id', studentId)
    .eq('status', 'enrolled')
    .order('enrolled_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load enrolments: ${error.message}`);
  }

  type Row = { batch_id: string; batch: { name: string } | { name: string }[] | null };
  return ((data || []) as unknown as Row[]).map((row) => {
    const batch = Array.isArray(row.batch) ? row.batch[0] : row.batch;
    return { batch_id: row.batch_id, batch_name: batch?.name ?? '' };
  });
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
    // Enrolment RPCs (0009_security_hardening_round1.sql) write status = 'enrolled';
    // filtering on 'active' always returned an empty list.
    .eq('status', 'enrolled');

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
