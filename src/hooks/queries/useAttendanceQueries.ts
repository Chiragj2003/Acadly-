import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAttendanceByBatchAndDate,
  commitBatchAttendance,
  correctAttendanceEntry,
  BatchAttendanceCommitInput,
  AttendanceAuditCorrectionInput,
} from '@/services/attendanceService';
import {
  subscribeToOfflineSync,
  getQueuedAttendanceCount,
  flushAttendanceQueue,
} from '@/lib/offlineQueue';

export const ATTENDANCE_QUERY_KEY = 'attendance';

export function useAttendance(batchId?: string, date?: string) {
  return useQuery({
    queryKey: [ATTENDANCE_QUERY_KEY, batchId, date],
    queryFn: () => getAttendanceByBatchAndDate(batchId!, date!),
    enabled: Boolean(batchId && date),
  });
}

export function useCommitAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BatchAttendanceCommitInput) => commitBatchAttendance(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [ATTENDANCE_QUERY_KEY, variables.batchId, variables.date],
      });
    },
  });
}

export function useCorrectAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AttendanceAuditCorrectionInput) => correctAttendanceEntry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ATTENDANCE_QUERY_KEY] });
    },
  });
}

/**
 * Hook to observe the number of attendance batches pending background offline sync.
 */
export function useOfflineAttendanceSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    getQueuedAttendanceCount().then(setPendingCount);
    const unsubscribe = subscribeToOfflineSync(setPendingCount);
    return unsubscribe;
  }, []);

  const flush = async () => {
    setIsSyncing(true);
    try {
      await flushAttendanceQueue();
      const count = await getQueuedAttendanceCount();
      setPendingCount(count);
    } finally {
      setIsSyncing(false);
    }
  };

  return { pendingCount, isPending: pendingCount > 0, isSyncing, flush };
}
