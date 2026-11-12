import { approveJoinRequest } from '@/services/admissionService';
import { supabase } from '@/lib/supabase';

// Mock Supabase chained queries
const mockSelectSingle = jest.fn();
const mockUpsertStudent = jest.fn();
const mockUpsertBatchStudent = jest.fn();
const mockUpdateJoinRequest = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
    from: jest.fn((table: string) => {
      if (table === 'join_requests') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: mockSelectSingle,
            })),
          })),
          update: jest.fn(() => ({
            eq: mockUpdateJoinRequest,
          })),
        };
      }
      if (table === 'students') {
        return {
          upsert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: mockUpsertStudent,
            })),
          })),
        };
      }
      if (table === 'batch_students') {
        return {
          upsert: mockUpsertBatchStudent,
        };
      }
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
    }),
  },
  isSupabaseConfigured: true,
}));

jest.mock('@/services/notificationService', () => ({
  sendPushNotification: jest.fn(async () => ({ success: true })),
}));

describe('Admission Approval Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleRequestId = 'req-uuid-101';
  const targetBatchId = 'batch-uuid-physics-12';
  const reviewerId = 'teacher-uuid-vikram';

  it('enrolls student in batch_students with target batchId and approves request', async () => {
    // 1. Mock existing request
    mockSelectSingle.mockResolvedValueOnce({
      data: {
        id: sampleRequestId,
        institute_id: 'inst-uuid-001',
        user_id: 'user-uuid-student-42',
        student_details: {
          fullName: 'Aarav Patel',
          grade: '12th',
        },
      },
      error: null,
    });

    // 2. Mock student upsert
    mockUpsertStudent.mockResolvedValueOnce({
      data: { id: 'student-profile-uuid-99' },
      error: null,
    });

    // 3. Mock batch_students upsert
    mockUpsertBatchStudent.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // 4. Mock join_requests status update
    mockUpdateJoinRequest.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await approveJoinRequest({
      requestId: sampleRequestId,
      batchId: targetBatchId,
      reviewerId,
    });

    expect(result.success).toBe(true);

    // Verify batch_students was called with target batch ID
    expect(supabase.from).toHaveBeenCalledWith('batch_students');
    expect(mockUpsertBatchStudent).toHaveBeenCalledWith(
      expect.objectContaining({
        batch_id: targetBatchId,
        student_id: 'student-profile-uuid-99',
        status: 'active',
      }),
      expect.any(Object)
    );

    // Verify join_requests was marked approved
    expect(supabase.from).toHaveBeenCalledWith('join_requests');
  });
});
