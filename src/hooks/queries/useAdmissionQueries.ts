import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPendingJoinRequests,
  submitJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  SubmitJoinRequestInput,
  ApproveJoinRequestInput,
  RejectJoinRequestInput,
} from '@/services/admissionService';

export const ADMISSION_QUERY_KEY = 'admission_requests';

export function useJoinRequests(instituteId?: string) {
  return useQuery({
    queryKey: [ADMISSION_QUERY_KEY, instituteId],
    queryFn: () => getPendingJoinRequests(instituteId!),
    enabled: Boolean(instituteId),
  });
}

export function useSubmitJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitJoinRequestInput) => submitJoinRequest(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [ADMISSION_QUERY_KEY, variables.instituteId],
      });
    },
  });
}

export function useApproveJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApproveJoinRequestInput) => approveJoinRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMISSION_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useRejectJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RejectJoinRequestInput) => rejectJoinRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMISSION_QUERY_KEY] });
    },
  });
}
