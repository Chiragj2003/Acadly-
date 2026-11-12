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
      )
    `)
    .eq('institute_id', instituteId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursorCreatedAt) {
    query = query.lt('created_at', cursorCreatedAt);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load student roster: ${error.message}`);
  }

  const rows = (data || []) as StudentListItem[];
  const nextCursor = rows.length === limit ? rows[rows.length - 1].created_at : null;

  return { students: rows, nextCursor };
};

/**
 * Fetch comprehensive 360 profile for a single student.
 */
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
