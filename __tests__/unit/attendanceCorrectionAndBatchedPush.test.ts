import {
  correctAttendanceEntry,
  batchNotifyAbsentParents,
} from '@/services/attendanceService';
import { supabase } from '@/lib/supabase';

const mockRpc = jest.fn();
const mockFunctionsInvoke = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    functions: {
      invoke: (...args: unknown[]) => mockFunctionsInvoke(...args),
    },
    from: jest.fn(() => ({
      select: (...args: unknown[]) => mockSelect(...args),
    })),
  },
  isSupabaseConfigured: true,
}));

describe('Attendance Corrections & Batched Absence Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const attendanceId = 'att-uuid-101';
  const batchId = 'batch-uuid-physics';
  const instituteId = 'inst-uuid-main';
  const todayDate = '2026-11-13';

  it('corrects an attendance entry via atomic correct_attendance RPC with a mandatory reason', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        record_id: attendanceId,
        new_status: 'P',
        audit_id: 'audit-log-uuid-1',
        reason: 'Medical certificate approved by faculty',
      },
      error: null,
    });

    const res = await correctAttendanceEntry({
      attendanceId,
      oldStatus: 'A',
      newStatus: 'P',
      reason: 'Medical certificate approved by faculty',
      correctedBy: 'teacher-uuid',
    });

    expect(res.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('correct_attendance', {
      p_attendance_id: attendanceId,
      p_new_status: 'P',
      p_reason: 'Medical certificate approved by faculty',
    });
  });

  it('fails closed when mandatory correction reason is rejected by database constraint', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'A mandatory reason of at least 3 characters is required for attendance correction' },
    });

    await expect(
      correctAttendanceEntry({
        attendanceId,
        oldStatus: 'A',
        newStatus: 'P',
        reason: 'ok',
        correctedBy: 'teacher-uuid',
      })
    ).rejects.toThrow('Failed to correct attendance: A mandatory reason of at least 3 characters is required for attendance correction');
  });

  it('dispatches a single batched push notification to parents of all absent students', async () => {
    // 1. Mock attendance select for absent students
    const mockAttChain = {
      eq: jest.fn().mockReturnThis(),
    };
    // Return two absent records
    (mockAttChain.eq as jest.Mock)
      .mockReturnValueOnce(mockAttChain)
      .mockReturnValueOnce(mockAttChain)
      .mockResolvedValueOnce({
        data: [{ student_id: 'stu-1' }, { student_id: 'stu-2' }],
        error: null,
      });

    mockSelect.mockReturnValueOnce(mockAttChain);

    // 2. Mock parent_students select mapping to parent user IDs
    const mockParentChain = {
      in: jest.fn().mockResolvedValueOnce({
        data: [
          { parent: { user_id: 'parent-user-1' } },
          { parent: { user_id: 'parent-user-2' } },
        ],
      }),
    };
    mockSelect.mockReturnValueOnce(mockParentChain);

    mockFunctionsInvoke.mockResolvedValueOnce({ data: { success: true } });

    const result = await batchNotifyAbsentParents(batchId, todayDate, instituteId);

    expect(result.success).toBe(true);
    expect(result.notifiedCount).toBe(2);
    expect(mockFunctionsInvoke).toHaveBeenCalledTimes(1);
    expect(mockFunctionsInvoke).toHaveBeenCalledWith('send-push-notifications', {
      body: expect.objectContaining({
        instituteId,
        userIds: ['parent-user-1', 'parent-user-2'],
        type: 'attendance_alert',
      }),
    });
  });
});
