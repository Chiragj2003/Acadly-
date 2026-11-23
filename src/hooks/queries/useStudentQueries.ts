import { useQuery } from '@tanstack/react-query';
import {
  getStudentsRoster,
  getStudent360Profile,
  getMyStudentRecord,
  getStudentCount,
  type StudentListItem,
} from '@/services/studentService';
import { Student360Profile } from '@/types/database';

export const STUDENTS_QUERY_KEY = 'students';

/**
 * Database row -> screen model. Only real values: empty strings / 0 when unknown
 * (it used to invent "Class 12", "CBSE", "IIT-JEE", "Active Batch" and "Guardian").
 */
const toProfile = (s: StudentListItem & { grade?: string; board?: string; school_name?: string }): Student360Profile => ({
  id: s.id,
  userId: s.user_id,
  name: s.user?.full_name || 'Student',
  rollNumber: s.roll_number || '',
  grade: s.class_grade || s.grade || '',
  board: s.board || '',
  school: s.school_or_college || s.school_name || '',
  targetExam: s.target_exam || '',
  batchName: s.batch_name || '',
  parentLinkCode: s.parent_link_code || '',
  guardianName: s.guardian_name || '',
  guardianPhone: s.guardian_phone || '',
  address: '',
  bloodGroup: s.blood_group || '',
  previousPercentage: s.previous_percentage || '',
  weakSubjects: s.weak_subjects || [],
  overallAttendance: s.overallAttendance ?? 0,
  feeStatus: s.fee_status ?? '',
  rank: s.rank ?? 0,
  percentile: s.avg_percentage ?? s.percentile ?? 0,
  teacherRemarks: [],
});

export function useStudentsRoster(
  instituteId?: string,
  batchId?: string,
  cursorCreatedAt?: string
) {
  return useQuery<Student360Profile[]>({
    queryKey: [STUDENTS_QUERY_KEY, instituteId, batchId, cursorCreatedAt],
    queryFn: async () => {
      const res = await getStudentsRoster(instituteId!, batchId, cursorCreatedAt);
      return (res.students || []).map(toProfile);
    },
    enabled: Boolean(instituteId),
  });
}

export function useStudentProfile(studentId?: string) {
  return useQuery<Student360Profile | null>({
    queryKey: [STUDENTS_QUERY_KEY, 'profile', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const s = await getStudent360Profile(studentId);
      return s ? toProfile(s) : null;
    },
    enabled: Boolean(studentId),
  });
}

/** The signed-in student's own record (null when not enrolled in this institute). */
export function useMyStudentRecord(instituteId?: string, userId?: string) {
  return useQuery({
    queryKey: [STUDENTS_QUERY_KEY, 'me', instituteId, userId],
    queryFn: () => getMyStudentRecord(instituteId!, userId!),
    enabled: Boolean(instituteId && userId),
  });
}

/** Exact active-student count for an institute. */
export function useStudentCount(instituteId?: string) {
  return useQuery({
    queryKey: [STUDENTS_QUERY_KEY, 'count', instituteId],
    queryFn: () => getStudentCount(instituteId!),
    enabled: Boolean(instituteId),
  });
}
