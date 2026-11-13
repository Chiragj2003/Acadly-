import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPendingJoinRequests,
  submitJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  waitlistJoinRequest,
  reapplyJoinRequest,
  getUserLatestJoinRequest,
  SubmitJoinRequestInput,
  ApproveJoinRequestInput,
  RejectJoinRequestInput,
  WaitlistJoinRequestInput,
  ReapplyJoinRequestInput,
} from '@/services/admissionService';

export const ADMISSION_QUERY_KEY = 'admission_requests';
export const USER_JOIN_REQUEST_KEY = 'user_join_request';

export function useJoinRequests(instituteId?: string) {
  return useQuery({
    queryKey: [ADMISSION_QUERY_KEY, instituteId],
    queryFn: () => getPendingJoinRequests(instituteId!),
    enabled: Boolean(instituteId),
  });
}

export function useUserJoinRequest(userId?: string) {
  return useQuery({
    queryKey: [USER_JOIN_REQUEST_KEY, userId],
    queryFn: () => getUserLatestJoinRequest(userId!),
    enabled: Boolean(userId),
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
      queryClient.invalidateQueries({
        queryKey: [USER_JOIN_REQUEST_KEY, variables.userId],
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
      queryClient.invalidateQueries({ queryKey: [USER_JOIN_REQUEST_KEY] });
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
      queryClient.invalidateQueries({ queryKey: [USER_JOIN_REQUEST_KEY] });
    },
  });
}

export function useWaitlistJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: WaitlistJoinRequestInput) => waitlistJoinRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMISSION_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_JOIN_REQUEST_KEY] });
    },
  });
}

export function useReapplyJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReapplyJoinRequestInput) => reapplyJoinRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMISSION_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_JOIN_REQUEST_KEY] });
    },
  });
}
