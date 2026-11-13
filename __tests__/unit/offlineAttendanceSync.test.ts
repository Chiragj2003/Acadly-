import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  enqueueAttendanceBatch,
  getQueuedAttendanceBatches,
  getQueuedAttendanceCount,
  flushAttendanceQueue,
  calculateBackoffDelay,
  formatInstituteDate,
  subscribeToOfflineSync,
  initOfflineSyncListeners,
  type QueuedAttendanceBatch,
} from '@/lib/offlineQueue';
import { supabase } from '@/lib/supabase';

const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
  isSupabaseConfigured: true,
}));

describe('Offline Attendance Sync & Network Resilience', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  const sampleBatch: QueuedAttendanceBatch = {
    id: 'batch-sync-001',
    batchId: '55555555-5555-5555-5555-555555555501',
    date: '2026-11-12',
    instituteId: 'a0000000-0000-0000-0000-000000000001',
    records: [
      { studentId: 'student-1', status: 'P' },
      { studentId: 'student-2', status: 'A' },
    ],
    queuedAt: '2026-11-12T10:00:00.000Z',
  };

  it('enqueues an attendance batch and updates pending count', async () => {
    let notifiedCount = 0;
    const unsubscribe = subscribeToOfflineSync((count) => {
      notifiedCount = count;
    });

    await enqueueAttendanceBatch(sampleBatch);

    const count = await getQueuedAttendanceCount();
    expect(count).toBe(1);
    expect(notifiedCount).toBe(1);

    const queued = await getQueuedAttendanceBatches();
    expect(queued[0].batchId).toBe(sampleBatch.batchId);
    expect(queued[0].retryCount).toBe(0);

    unsubscribe();
  });

  it('calculates deterministic exponential backoff delays with 30s cap', () => {
    expect(calculateBackoffDelay(0)).toBe(1000);  // 1s
    expect(calculateBackoffDelay(1)).toBe(2000);  // 2s
    expect(calculateBackoffDelay(2)).toBe(4000);  // 4s
    expect(calculateBackoffDelay(3)).toBe(8000);  // 8s
    expect(calculateBackoffDelay(4)).toBe(16000); // 16s
    expect(calculateBackoffDelay(5)).toBe(30000); // capped at 30s
    expect(calculateBackoffDelay(10)).toBe(30000); // capped at 30s
  });

  it('flushes queue successfully via atomic RPC commit_attendance', async () => {
    mockRpc.mockResolvedValueOnce({ data: { success: true, count: 2 }, error: null });

    await enqueueAttendanceBatch(sampleBatch);
    expect(await getQueuedAttendanceCount()).toBe(1);

    const result = await flushAttendanceQueue();
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);

    expect(mockRpc).toHaveBeenCalledWith('commit_attendance', {
      p_batch_id: sampleBatch.batchId,
      p_date: sampleBatch.date,
      p_rows: sampleBatch.records,
    });

    expect(await getQueuedAttendanceCount()).toBe(0);
  });

  it('increments retryCount on network failure and preserves item in queue', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Network connection timeout' },
    });

    await enqueueAttendanceBatch(sampleBatch);

    const result = await flushAttendanceQueue();
    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);

    const remaining = await getQueuedAttendanceBatches();
    expect(remaining.length).toBe(1);
    expect(remaining[0].retryCount).toBe(1);
  });

  it('formats institute date deterministically without timezone shifts', () => {
    // 2026-11-12 at 22:30 IST is 17:00 UTC on the same day
    const date = new Date('2026-11-12T17:00:00.000Z');
    const formatted = formatInstituteDate(date, 'Asia/Kolkata');
    expect(formatted).toBe('2026-11-12');
  });

  it('initializes and tears down NetInfo & AppState listeners cleanly', () => {
    const cleanup = initOfflineSyncListeners();
    expect(typeof cleanup).toBe('function');
    cleanup();
  });
});
