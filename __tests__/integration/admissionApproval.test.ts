import { approveJoinRequest } from '@/services/admissionService';
import { supabase } from '@/lib/supabase';

const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: jest.fn(),
  },
  isSupabaseConfigured: true,
}));

describe('Admission Approval Integration (Atomic RPC)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleRequestId = 'req-uuid-101';
  const targetBatchId = 'batch-uuid-physics-12';
  const reviewerId = 'teacher-uuid-vikram';

  it('calls atomic approve_join_request RPC with requestId and target batchId in ONE transaction', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        request_id: sampleRequestId,
        batch_id: targetBatchId,
      },
      error: null,
    });

    const result = await approveJoinRequest({
      requestId: sampleRequestId,
      batchId: targetBatchId,
      reviewerId,
    });

    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('approve_join_request', {
      p_request_id: sampleRequestId,
      p_batch_id: targetBatchId,
    });
  });

  it('fails closed and throws error when atomic RPC returns an error', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Unauthorized or target batch not found' },
    });

    await expect(
      approveJoinRequest({
        requestId: sampleRequestId,
        batchId: targetBatchId,
        reviewerId,
      })
    ).rejects.toThrow('Failed to approve join request: Unauthorized or target batch not found');
  });
});
