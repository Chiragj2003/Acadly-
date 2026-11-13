import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBatchSchedule,
  fetchWeekdaySchedule,
  upsertBatchSchedule,
  deleteBatchSchedule,
  type Weekday,
  type UpsertBatchScheduleInput,
} from '@/services/scheduleService';

export const SCHEDULE_QUERY_KEY = 'batch_schedule';

export function useBatchSchedule(batchId?: string) {
  return useQuery({
    queryKey: [SCHEDULE_QUERY_KEY, batchId],
    queryFn: () => fetchBatchSchedule(batchId!),
    enabled: Boolean(batchId),
  });
}

export function useWeekdaySchedule(batchId?: string, weekday?: Weekday) {
  return useQuery({
    queryKey: [SCHEDULE_QUERY_KEY, batchId, weekday],
    queryFn: () => fetchWeekdaySchedule(batchId!, weekday!),
    enabled: Boolean(batchId && weekday),
  });
}

export function useUpsertBatchSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpsertBatchScheduleInput) => upsertBatchSchedule(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, variables.batch_id],
      });
    },
  });
}

export function useDeleteBatchSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; batchId: string }) => deleteBatchSchedule(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, variables.batchId],
      });
    },
  });
}
