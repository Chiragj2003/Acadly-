import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateQuizDraft,
  gradeSubmissionWithAI,
  getTeacherAiQuota,
  type GenerateQuizDraftInput,
  type GradeSubmissionWithAiInput,
} from '@/services/aiService';

export const AI_QUOTA_QUERY_KEY = ['teacher-ai-quota'];

export function useTeacherAiQuota(teacherId: string | undefined) {
  return useQuery({
    queryKey: [...AI_QUOTA_QUERY_KEY, teacherId],
    queryFn: () => getTeacherAiQuota(teacherId!),
    enabled: Boolean(teacherId),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useGenerateQuizDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateQuizDraftInput) => generateQuizDraft(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_QUOTA_QUERY_KEY });
    },
  });
}

export function useGradeSubmissionWithAI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GradeSubmissionWithAiInput) => gradeSubmissionWithAI(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_QUOTA_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}
