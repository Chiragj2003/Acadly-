import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  computeAttendanceTrend,
  computeSubjectMastery,
  recordExamMarks,
  type RecordExamMarksInput,
} from '@/services/academicAnalyticsService';

export const ATTENDANCE_TREND_QUERY_KEY = 'attendance_trend';
export const SUBJECT_MASTERY_QUERY_KEY = 'subject_mastery';

export function useAttendanceTrend(studentId?: string, batchId?: string) {
  return useQuery({
    queryKey: [ATTENDANCE_TREND_QUERY_KEY, studentId, batchId],
    queryFn: () => computeAttendanceTrend(studentId!, batchId),
    enabled: Boolean(studentId),
  });
}

export function useSubjectMastery(studentId?: string) {
  return useQuery({
    queryKey: [SUBJECT_MASTERY_QUERY_KEY, studentId],
    queryFn: () => computeSubjectMastery(studentId!),
    enabled: Boolean(studentId),
  });
}

export function useRecordExamMarks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      recordedByUserId,
    }: {
      input: RecordExamMarksInput;
      recordedByUserId?: string;
    }) => recordExamMarks(input, recordedByUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SUBJECT_MASTERY_QUERY_KEY],
      });
    },
  });
}
