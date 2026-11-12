import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAssignments,
  getAssignmentById,
  createAssignment,
} from '@/services/assignmentService';
import {
  getSubmissionsForAssignment,
  getStudentSubmission,
  submitHomework,
  gradeSubmission,
  SubmitHomeworkInput,
  GradeSubmissionInput,
} from '@/services/submissionService';
import { type Assignment } from '@/types/database';

export const ASSIGNMENTS_QUERY_KEY = 'assignments';
export const SUBMISSIONS_QUERY_KEY = 'submissions';

export function useAssignments(batchId?: string) {
  return useQuery({
    queryKey: [ASSIGNMENTS_QUERY_KEY, batchId],
    queryFn: () => getAssignments(batchId!),
    enabled: Boolean(batchId),
  });
}

export function useAssignment(assignmentId?: string) {
  return useQuery({
    queryKey: [ASSIGNMENTS_QUERY_KEY, 'detail', assignmentId],
    queryFn: () => getAssignmentById(assignmentId!),
    enabled: Boolean(assignmentId),
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Assignment, 'id' | 'created_at'>) => createAssignment(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [ASSIGNMENTS_QUERY_KEY, variables.batch_id],
      });
    },
  });
}

export function useSubmissions(assignmentId?: string) {
  return useQuery({
    queryKey: [SUBMISSIONS_QUERY_KEY, assignmentId],
    queryFn: () => getSubmissionsForAssignment(assignmentId!),
    enabled: Boolean(assignmentId),
  });
}

export function useStudentSubmission(assignmentId?: string, studentId?: string) {
  return useQuery({
    queryKey: [SUBMISSIONS_QUERY_KEY, 'student', assignmentId, studentId],
    queryFn: () => getStudentSubmission(assignmentId!, studentId!),
    enabled: Boolean(assignmentId && studentId),
  });
}

export function useSubmitHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitHomeworkInput) => submitHomework(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [SUBMISSIONS_QUERY_KEY, variables.assignmentId],
      });
    },
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GradeSubmissionInput) => gradeSubmission(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBMISSIONS_QUERY_KEY] });
    },
  });
}
