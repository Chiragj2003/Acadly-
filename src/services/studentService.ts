import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface StudentListItem {
  id: string;
  institute_id: string;
  user_id: string;
  roll_number: string;
  admission_number: string;
  parent_link_code: string;
  class_grade: string;
  target_exam?: string;
  school_or_college?: string;
  guardian_name?: string;
  guardian_phone?: string;
  blood_group?: string;
  previous_percentage?: string;
  weak_subjects?: string[];
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    phone?: string;
  };
  overallAttendance?: number;
  rank?: number;
  percentile?: number;
}

/**
 * Fetch students roster for an institute with cursor-based pagination (limit 30).
 */
export const getStudentsRoster = async (
  instituteId: string,
  batchId?: string,
  cursorCreatedAt?: string,
  limit = 30
): Promise<{ students: StudentListItem[]; nextCursor: string | null }> => {
  if (!isSupabaseConfigured || !instituteId) {
    return { students: [], nextCursor: null };
  }

  // When a batch is given, inner-join batch_students so only that batch's
  // students come back (previously batchId was accepted but ignored, so the
  // teacher's roll call showed the whole institute).
  const batchJoin = batchId ? ',\n      batch_students!inner(batch_id, status)' : '';

  let query = supabase
    .from('students')
    .select(`
      *,
      user:profiles!students_user_id_fkey(
        id,
        full_name,
        email,
        avatar_url,
        phone
      )${batchJoin}
    `)
    .eq('institute_id', instituteId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (batchId) {
    query = query.eq('batch_students.batch_id', batchId).eq('batch_students.status', 'enrolled');
  }

  if (cursorCreatedAt) {
    query = query.lt('created_at', cursorCreatedAt);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load student roster: ${error.message}`);
  }

  // The select string is built dynamically (optional batch join), so supabase-js
  // cannot infer the row type; cast through unknown.
  const rows = (data || []) as unknown as StudentListItem[];
  const nextCursor = rows.length === limit ? rows[rows.length - 1].created_at : null;

  return { students: rows, nextCursor };
};

/**
 * Fetch comprehensive 360 profile for a single student.
 */
/**
 * Exact number of active students in an institute (not limited by roster paging).
 */
export const getStudentCount = async (instituteId: string): Promise<number> => {
  if (!isSupabaseConfigured || !instituteId) return 0;

  const { count, error } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('institute_id', instituteId)
    .eq('is_archived', false);

  if (error) {
    throw new Error(`Failed to count students: ${error.message}`);
  }

  return count ?? 0;
};

/**
 * Fetch the signed-in user's own student record in an institute.
 * Uses students.user_id so it works regardless of roster pagination.
 */
export const getMyStudentRecord = async (
  instituteId: string,
  userId: string
): Promise<StudentListItem | null> => {
  if (!isSupabaseConfigured || !instituteId || !userId) return null;

  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      user:profiles!students_user_id_fkey(
        id,
        full_name,
        email,
        avatar_url,
        phone
      )
    `)
    .eq('institute_id', instituteId)
    .eq('user_id', userId)
    .eq('is_archived', false)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load your student record: ${error.message}`);
  }

  return (data as StudentListItem | null) ?? null;
};

export const getStudent360Profile = async (
  studentId: string
): Promise<StudentListItem | null> => {
  if (!isSupabaseConfigured || !studentId) return null;

  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      user:profiles!students_user_id_fkey(
        id,
        full_name,
        email,
        avatar_url,
        phone
      )
    `)
    .eq('id', studentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load student profile: ${error.message}`);
  }

  return data as StudentListItem | null;
};
