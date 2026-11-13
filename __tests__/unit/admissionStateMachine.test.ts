import {
  rejectJoinRequest,
  waitlistJoinRequest,
  reapplyJoinRequest,
  type StudentExtraDetails,
} from '@/services/admissionService';
import { supabase } from '@/lib/supabase';

const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: jest.fn(),
  },
  isSupabaseConfigured: true,
}));

describe('Admission State Machine Transitions (pending -> rejected/waitlisted -> pending)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const requestId = '11111111-2222-3333-4444-555555555555';
  const updatedStudentDetails: StudentExtraDetails = {
    fullName: 'Rahul Sharma',
    grade: 'Class 12',
    board: 'CBSE',
    targetExam: 'IIT-JEE 2026',
    school: 'DPS Pune',
    previousPercentage: '92%',
    weakSubjects: ['Rotational Mechanics'],
    guardianName: 'Suresh Sharma',
    guardianPhone: '9822011223',
    bloodGroup: 'B+',
  };

  it('rejects an admission application with documented reason via reject_join_request RPC', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        status: 'rejected',
        request_id: requestId,
        reason: 'Seat capacity full for batch',
      },
      error: null,
    });

    const res = await rejectJoinRequest({
      requestId,
      reason: 'Seat capacity full for batch',
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('rejected');
    expect(mockRpc).toHaveBeenCalledWith('reject_join_request', {
      p_request_id: requestId,
      p_reason: 'Seat capacity full for batch',
    });
  });

  it('waitlists an admission application with documented intake reason via waitlist_join_request RPC', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        status: 'waitlisted',
        request_id: requestId,
        reason: 'Waitlisted for upcoming Phase 2 batch',
      },
      error: null,
    });

    const res = await waitlistJoinRequest({
      requestId,
      reason: 'Waitlisted for upcoming Phase 2 batch',
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('waitlisted');
    expect(mockRpc).toHaveBeenCalledWith('waitlist_join_request', {
      p_request_id: requestId,
      p_reason: 'Waitlisted for upcoming Phase 2 batch',
    });
  });

  it('allows a student to edit details and re-apply, resetting status to pending via reapply_join_request RPC', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        status: 'pending',
        request_id: requestId,
        reapplied_at: new Date().toISOString(),
      },
      error: null,
    });

    const res = await reapplyJoinRequest({
      requestId,
      studentDetails: updatedStudentDetails,
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('pending');
    expect(mockRpc).toHaveBeenCalledWith('reapply_join_request', {
      p_request_id: requestId,
      p_updated_details: updatedStudentDetails,
    });
  });

  it('fails closed when rejection RPC encounters an unauthorized caller', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Unauthorized: Only faculty or admin can reject join requests' },
    });

    await expect(
      rejectJoinRequest({
        requestId,
        reason: 'No reason',
      })
    ).rejects.toThrow('Failed to reject join request: Unauthorized: Only faculty or admin can reject join requests');
  });
});
