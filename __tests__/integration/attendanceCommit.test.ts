import { commitBatchAttendance } from '@/services/attendanceService';
import { supabase } from '@/lib/supabase';

const mockUpsert = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: mockUpsert,
    })),
  },
  isSupabaseConfigured: true,
}));

jest.mock('@/lib/offlineQueue', () => ({
  enqueueAttendanceBatch: jest.fn(),
  flushAttendanceQueue: jest.fn(async () => {}),
}));

describe('Attendance Commit Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validBatchId = 'f4c1d553-09ad-2d25-0bec-5d8ab5400002';
  const validInstId = 'e3b0c442-98fc-1c14-9afb-4c7fa4390001';
  const dateStr = '2026-11-12';

  it('calls upsert exactly once with the batch rows on conflict (student_id,batch_id,date)', async () => {
    mockUpsert.mockResolvedValueOnce({ data: null, error: null });

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

    // Verify supabase.from('attendance') was queried
    expect(supabase.from).toHaveBeenCalledWith('attendance');

    // Verify upsert called once
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    // Verify row structure and onConflict constraint
    const [rows, options] = mockUpsert.mock.calls[0];
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      institute_id: validInstId,
      batch_id: validBatchId,
      student_id: 'student-uuid-01',
      date: dateStr,
      status: 'P',
      remarks: 'On time',
    });
    expect(options).toEqual({ onConflict: 'student_id,batch_id,date' });
  });

  it('handles offline queue when network error occurs', async () => {
    mockUpsert.mockResolvedValueOnce({
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
  });
});
