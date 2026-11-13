import {
  submitWrittenHomework,
  gradeWrittenSubmission,
} from '@/services/submissionService';
import { supabase } from '@/lib/supabase';

const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: jest.fn(),
  },
  isSupabaseConfigured: true,
}));

describe('Homework Lifecycle (assigned -> submitted -> graded -> returned)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const assignmentId = 'asg-uuid-physics-dpp-01';
  const submissionId = 'sub-uuid-student-submission-01';

  it('submits written homework with attached documents and records submission status via RPC', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        submission_id: submissionId,
        status: 'submitted',
        is_late: false,
        attempt_number: 1,
      },
      error: null,
    });

    const res = await submitWrittenHomework({
      assignmentId,
      fileUrls: ['https://storage.acadly.app/solutions/derivations.pdf'],
      submissionText: 'All 5 calculus questions completed.',
    });

    expect(res.success).toBe(true);
    expect(res.submissionId).toBe(submissionId);
    expect(res.status).toBe('submitted');
    expect(res.isLate).toBe(false);
    expect(mockRpc).toHaveBeenCalledWith('submit_written_homework', {
      p_assignment_id: assignmentId,
      p_file_urls: ['https://storage.acadly.app/solutions/derivations.pdf'],
      p_submission_text: 'All 5 calculus questions completed.',
    });
  });

  it('grades a written homework submission and marks status as graded', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        submission_id: submissionId,
        status: 'graded',
        score: 28,
        feedback: 'Excellent mathematical rigour.',
      },
      error: null,
    });

    const res = await gradeWrittenSubmission({
      submissionId,
      score: 28,
      feedback: 'Excellent mathematical rigour.',
      returnForRework: false,
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('graded');
    expect(res.score).toBe(28);
    expect(mockRpc).toHaveBeenCalledWith('grade_written_submission', {
      p_submission_id: submissionId,
      p_score: 28,
      p_feedback: 'Excellent mathematical rigour.',
      p_return_for_rework: false,
    });
  });

  it('returns a written homework submission for rework when corrections are required', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        submission_id: submissionId,
        status: 'returned',
        score: 12,
        feedback: 'Step 3 vector direction incorrect. Please recalculate.',
      },
      error: null,
    });

    const res = await gradeWrittenSubmission({
      submissionId,
      score: 12,
      feedback: 'Step 3 vector direction incorrect. Please recalculate.',
      returnForRework: true,
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('returned');
    expect(mockRpc).toHaveBeenCalledWith('grade_written_submission', {
      p_submission_id: submissionId,
      p_score: 12,
      p_feedback: 'Step 3 vector direction incorrect. Please recalculate.',
      p_return_for_rework: true,
    });
  });

  it('fails closed when assignment deadline has passed and submission is closed', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Submission deadline has passed. This assignment is closed.' },
    });

    await expect(
      submitWrittenHomework({
        assignmentId,
        fileUrls: ['https://storage.acadly.app/solutions/late.pdf'],
      })
    ).rejects.toThrow('Failed to submit written homework: Submission deadline has passed. This assignment is closed.');
  });
});
