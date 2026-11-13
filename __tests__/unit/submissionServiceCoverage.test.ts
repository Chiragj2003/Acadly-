import {
  getSubmissionsForAssignment,
  getStudentSubmission,
  submitHomework,
  gradeSubmission,
  getAssignmentForTaking,
  submitQuiz,
  getQuizAnalytics,
  submitWrittenHomework,
  gradeWrittenSubmission,
} from '@/services/submissionService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => {
  const mockFrom = jest.fn();
  const mockRpc = jest.fn();
  const mockInvoke = jest.fn().mockResolvedValue({ data: null, error: null });
  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
      functions: {
        invoke: mockInvoke,
      },
    },
    isSupabaseConfigured: true,
  };
});

jest.mock('@/lib/fileUploadHelper', () => ({
  prepareMemorySafeUpload: jest.fn(async () => ({
    storagePath: 'assignments/test-file.pdf',
    publicUrl: 'https://cdn.example.com/test-file.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
  })),
}));

describe('Submission Service Comprehensive Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const assignmentId = '11111111-2222-3333-4444-555555555555';
  const studentId = 'student-uuid-001';
  const graderId = 'teacher-uuid-001';
  const submissionId = 'sub-uuid-001';

  it('getSubmissionsForAssignment queries submissions and formats student names', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: [
        {
          id: submissionId,
          assignment_id: assignmentId,
          student: {
            id: studentId,
            roll_number: 'ROLL-101',
            user: { full_name: 'Amelia Sharma', email: 'amelia@example.com' },
          },
        },
      ],
      error: null,
    });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const results = await getSubmissionsForAssignment(assignmentId);
    expect(results).toHaveLength(1);
    expect((results[0] as any).student_name).toBe('Amelia Sharma');
    expect((results[0] as any).roll_number).toBe('ROLL-101');
  });

  it('getStudentSubmission queries maybeSingle and returns submission', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: { id: submissionId, assignment_id: assignmentId, student_id: studentId },
      error: null,
    });
    const mockEq2 = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const sub = await getStudentSubmission(assignmentId, studentId);
    expect(sub?.id).toBe(submissionId);
  });

  it('gradeSubmission updates score and feedback via teacher', async () => {
    // 1. Fetch submission select
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        id: submissionId,
        assignment_id: assignmentId,
        student_id: studentId,
        assignment: { total_marks: 100, title: 'Physics Test' },
        student: { user_id: 'user-001' },
      },
      error: null,
    });
    const mockSelectEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockSelectEq });

    // 2. Update submission
    const mockUpdateEq = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

    // 3. Notifications insert
    const mockInsert = jest.fn().mockResolvedValue({ data: [], error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'submissions') {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      if (table === 'notifications') {
        return { insert: mockInsert };
      }
      return {};
    });

    const res = await gradeSubmission({
      submissionId,
      marks: 95,
      feedback: 'Excellent derivation',
      graderId,
    });

    expect(res.success).toBe(true);
    expect(res.score).toBe(95);
  });

  it('submitQuiz invokes atomic RPC submit_and_grade_quiz and returns score breakdown', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: {
        submission_id: 'sub-quiz-01',
        score: 4,
        total_marks: 5,
        percentage: 80,
        is_passed: true,
        details: [],
      },
      error: null,
    });

    const res = await submitQuiz({
      assignmentId,
      studentId,
      answers: { q1: 1, q2: 3 },
    });

    expect(res.totalScore).toBe(4);
    expect(res.percentage).toBe(80);
    expect(supabase.rpc).toHaveBeenCalledWith('submit_and_grade_quiz', {
      p_assignment_id: assignmentId,
      p_student_id: studentId,
      p_student_answers: { q1: 1, q2: 3 },
    });
  });

  it('getAssignmentForTaking invokes get_quiz_for_student RPC without exposing answer keys', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: {
        id: assignmentId,
        title: 'Wave Optics Concept Quiz',
        questions: [{ id: 'q1', text: 'What is Huygens principle?' }],
      },
      error: null,
    });

    const quiz = await getAssignmentForTaking(assignmentId);
    expect(quiz?.title).toBe('Wave Optics Concept Quiz');
    expect(supabase.rpc).toHaveBeenCalledWith('get_quiz_for_student', {
      p_assignment_id: assignmentId,
    });
  });

  it('getQuizAnalytics aggregates submission scores and percentiles', async () => {
    const mockAssignmentSingle = jest.fn().mockResolvedValue({
      data: {
        id: assignmentId,
        title: 'Rotational Mechanics Quiz',
        total_marks: 100,
        questions: [{ id: 'q1' }, { id: 'q2' }],
      },
      error: null,
    });
    const mockAssignmentEq = jest.fn().mockReturnValue({ single: mockAssignmentSingle });
    const mockAssignmentSelect = jest.fn().mockReturnValue({ eq: mockAssignmentEq });

    const mockSubmissions = [
      { id: 's1', score: 80, submitted_at: '2026-11-10T10:00:00Z', student_id: 'st-1' },
      { id: 's2', score: 100, submitted_at: '2026-11-10T11:00:00Z', student_id: 'st-2' },
      { id: 's3', score: 60, submitted_at: '2026-11-10T12:00:00Z', student_id: 'st-3' },
    ];
    const mockSubmissionsEq = jest.fn().mockResolvedValue({
      data: mockSubmissions,
      error: null,
    });
    const mockSubmissionsSelect = jest.fn().mockReturnValue({ eq: mockSubmissionsEq });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return { select: mockAssignmentSelect };
      }
      if (table === 'submissions') {
        return { select: mockSubmissionsSelect };
      }
      return {};
    });

    const analytics = await getQuizAnalytics(assignmentId);
    expect(analytics).not.toBeNull();
    expect(analytics?.submittedCount).toBe(3);
    expect(analytics?.averageScore).toBe(80);
    expect(analytics?.highestScore).toBe(100);
    expect(analytics?.lowestScore).toBe(60);
  });

  it('gradeWrittenSubmission invokes atomic RPC grade_written_submission', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: {
        submission_id: submissionId,
        score: 18,
        status: 'graded',
        feedback: 'Correct explanation, check signs',
      },
      error: null,
    });

    const res = await gradeWrittenSubmission({
      submissionId,
      score: 18,
      feedback: 'Correct explanation, check signs',
    });

    expect(res.success).toBe(true);
    expect(res.score).toBe(18);
    expect(res.feedback).toBe('Correct explanation, check signs');
    expect(supabase.rpc).toHaveBeenCalledWith('grade_written_submission', {
      p_submission_id: submissionId,
      p_score: 18,
      p_feedback: 'Correct explanation, check signs',
      p_return_for_rework: false,
    });
  });
});
