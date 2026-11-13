import {
  submitJoinRequest,
  getPendingJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  waitlistJoinRequest,
  reapplyJoinRequest,
  getUserLatestJoinRequest,
} from '@/services/admissionService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => {
  const mockFrom = jest.fn();
  const mockRpc = jest.fn();
  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
    },
    isSupabaseConfigured: true,
  };
});

describe('Admission Service Comprehensive Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const instituteId = '11111111-1111-1111-1111-111111111111';
  const requestId = 'req-uuid-001';
  const userId = 'user-uuid-001';

  it('submitJoinRequest inserts join request with pending status', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: requestId },
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const req = await submitJoinRequest({
      instituteId,
      userId,
      teacherCode: 'APEX-JEE-2026',
      targetType: 'coaching_center',
      studentDetails: {
        studentName: 'Rohan Sharma',
        parentPhone: '9876543210',
        grade: 'Class 12',
        targetExam: 'JEE Advanced',
      },
    });

    expect(req.success).toBe(true);
    expect(req.requestId).toBe(requestId);
  });

  it('getPendingJoinRequests fetches join requests with student profile', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: [
        {
          id: requestId,
          institute_id: instituteId,
          status: 'pending',
          user: { full_name: 'Rohan Sharma', email: 'rohan@example.com' },
        },
      ],
      error: null,
    });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const requests = await getPendingJoinRequests(instituteId);
    expect(requests).toHaveLength(1);
    expect((requests[0] as any).user?.full_name).toBe('Rohan Sharma');
  });

  it('approveJoinRequest invokes atomic RPC approve_join_request', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: { success: true },
      error: null,
    });

    await approveJoinRequest({
      requestId,
      batchId: 'batch-001',
    });
    expect(supabase.rpc).toHaveBeenCalledWith('approve_join_request', {
      p_request_id: requestId,
      p_batch_id: 'batch-001',
    });
  });

  it('rejectJoinRequest updates status to rejected with reason', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: { success: true, status: 'rejected' },
      error: null,
    });

    await rejectJoinRequest({
      requestId,
      reason: 'Target batch is at maximum capacity',
    });
    expect(supabase.rpc).toHaveBeenCalledWith('reject_join_request', {
      p_request_id: requestId,
      p_reason: 'Target batch is at maximum capacity',
    });
  });

  it('waitlistJoinRequest updates status to waitlisted', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: { success: true, status: 'waitlisted' },
      error: null,
    });

    await waitlistJoinRequest({
      requestId,
      reason: 'Awaiting seat confirmation',
    });
    expect(supabase.rpc).toHaveBeenCalledWith('waitlist_join_request', {
      p_request_id: requestId,
      p_reason: 'Awaiting seat confirmation',
    });
  });

  it('reapplyJoinRequest resets status to pending and clears rejection reason', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: { success: true, status: 'pending' },
      error: null,
    });

    await reapplyJoinRequest({
      requestId,
      studentDetails: { studentName: 'Rohan Sharma Updated' } as any,
    });
    expect(supabase.rpc).toHaveBeenCalledWith('reapply_join_request', {
      p_request_id: requestId,
      p_updated_details: { studentName: 'Rohan Sharma Updated' },
    });
  });

  it('getUserLatestJoinRequest returns student latest request', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: { id: requestId, status: 'pending' },
      error: null,
    });
    const mockLimit = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const req = await getUserLatestJoinRequest(userId);
    expect(req?.id).toBe(requestId);
  });
});
