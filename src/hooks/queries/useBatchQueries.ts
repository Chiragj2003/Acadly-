import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBatches,
  getBatchById,
  createBatch,
  getBatchStudents,
  getStudentEnrollments,
  getSubjects,
} from '@/services/batchService';
import { type Batch } from '@/types/database';

export const BATCHES_QUERY_KEY = 'batches';
export const SUBJECTS_QUERY_KEY = 'subjects';

export function useBatches(instituteId?: string) {
  return useQuery({
    queryKey: [BATCHES_QUERY_KEY, instituteId],
    queryFn: () => getBatches(instituteId!),
    enabled: Boolean(instituteId),
  });
}

export function useStudentEnrollments(studentId?: string) {
  return useQuery({
    queryKey: [BATCHES_QUERY_KEY, 'enrollments', studentId],
    queryFn: () => getStudentEnrollments(studentId!),
    enabled: Boolean(studentId),
  });
}

export function useBatch(batchId?: string) {
  return useQuery({
    queryKey: [BATCHES_QUERY_KEY, 'detail', batchId],
    queryFn: () => getBatchById(batchId!),
    enabled: Boolean(batchId),
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Batch, 'id' | 'created_at' | 'student_count'>) => createBatch(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [BATCHES_QUERY_KEY, variables.institute_id],
      });
    },
  });
}

export function useBatchStudents(batchId?: string) {
  return useQuery({
    queryKey: [BATCHES_QUERY_KEY, 'students', batchId],
    queryFn: () => getBatchStudents(batchId!),
    enabled: Boolean(batchId),
  });
}

export function useSubjects(instituteId?: string) {
  return useQuery({
    queryKey: [SUBJECTS_QUERY_KEY, instituteId],
    queryFn: () => getSubjects(instituteId!),
    enabled: Boolean(instituteId),
  });
}
