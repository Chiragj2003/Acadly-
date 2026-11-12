import { useQuery } from '@tanstack/react-query';
import {
  getStudentsRoster,
  getStudent360Profile,
} from '@/services/studentService';
import { Student360Profile } from '@/types/database';

export const STUDENTS_QUERY_KEY = 'students';

export function useStudentsRoster(
  instituteId?: string,
  batchId?: string,
  cursorCreatedAt?: string
) {
  return useQuery<Student360Profile[]>({
    queryKey: [STUDENTS_QUERY_KEY, instituteId, batchId, cursorCreatedAt],
    queryFn: async () => {
      const res = await getStudentsRoster(instituteId!, batchId, cursorCreatedAt);
      if (res.students && res.students.length > 0) {
        return res.students.map((s) => ({
          id: s.id,
          name: s.user?.full_name || 'Student',
          rollNumber: s.roll_number || '#00',
          grade: s.class_grade || 'Class 12',
          board: 'CBSE',
          school: s.school_or_college || 'School',
          targetExam: s.target_exam || 'IIT-JEE',
          batchName: 'Active Batch',
          parentLinkCode: s.parent_link_code || '',
          guardianName: s.guardian_name || 'Guardian',
          guardianPhone: s.guardian_phone || '',
          address: 'Pune, Maharashtra',
          bloodGroup: s.blood_group || 'O+',
          previousPercentage: s.previous_percentage || '90%',
          weakSubjects: s.weak_subjects || [],
          overallAttendance: s.overallAttendance || 94.0,
          feeStatus: 'Paid Full',
          rank: s.rank || 1,
          percentile: s.percentile || 95.0,
          teacherRemarks: ['Active student in regular batch.'],
        }));
      }
      return [];
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
      if (s) {
        return {
          id: s.id,
          name: s.user?.full_name || 'Student',
          rollNumber: s.roll_number || '#00',
          grade: s.class_grade || 'Class 12',
          board: 'CBSE',
          school: s.school_or_college || 'School',
          targetExam: s.target_exam || 'IIT-JEE',
          batchName: 'Active Batch',
          parentLinkCode: s.parent_link_code || '',
          guardianName: s.guardian_name || 'Guardian',
          guardianPhone: s.guardian_phone || '',
          address: 'Pune, Maharashtra',
          bloodGroup: s.blood_group || 'O+',
          previousPercentage: s.previous_percentage || '90%',
          weakSubjects: s.weak_subjects || [],
          overallAttendance: s.overallAttendance || 94.0,
          feeStatus: 'Paid Full',
          rank: s.rank || 1,
          percentile: s.percentile || 95.0,
          teacherRemarks: ['Active student in regular batch.'],
        };
      }
      return null;
    },
    enabled: Boolean(studentId),
  });
}
