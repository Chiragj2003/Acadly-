import { commitBatchAttendance } from '@/services/attendanceService';
import { supabase } from '@/lib/supabase';
import { enqueueAttendanceBatch } from '@/lib/offlineQueue';

const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
  isSupabaseConfigured: true,
}));

jest.mock('@/lib/offlineQueue', () => ({
  enqueueAttendanceBatch: jest.fn(async () => {}),
  flushAttendanceQueue: jest.fn(async () => {}),
}));

describe('Attendance Commit Integration (Atomic RPC)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validBatchId = 'f4c1d553-09ad-2d25-0bec-5d8ab5400002';
  const validInstId = 'e3b0c442-98fc-1c14-9afb-4c7fa4390001';
  const dateStr = '2026-11-12';

  it('calls atomic commit_attendance RPC with batch, date, and rows in ONE transaction', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { success: true, count: 3 },
      error: null,
    });

    const records = [
      { studentId: 'student-uuid-01', status: 'P' as const, remarks: 'On time' },
      { studentId: 'student-uuid-02', status: 'A' as const },
      { studentId: 'student-uuid-03', status: 'L' as const, remarks: '10m late' },
    ];

    const res = await commitBatchAttendance({
      batchId: validBatchId,
      instituteId: validInstId,
      date: dateStr,
      records,
    });

    expect(res.success).toBe(true);
    expect(res.count).toBe(3);

    // Verify atomic RPC was called once with proper payload
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('commit_attendance', {
      p_batch_id: validBatchId,
      p_date: dateStr,
      p_rows: records,
    });
  });

  it('handles offline queue when network error occurs', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Failed to fetch (network error)' },
    });

    const records = [{ studentId: 'student-uuid-01', status: 'P' as const }];

    const res = await commitBatchAttendance({
      batchId: validBatchId,
      instituteId: validInstId,
      date: dateStr,
      records,
    });

    expect(res.success).toBe(true);
    expect(res.queuedOffline).toBe(true);
    expect(enqueueAttendanceBatch).toHaveBeenCalledTimes(1);
  });
});
