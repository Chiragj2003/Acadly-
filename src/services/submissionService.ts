import * as FileSystem from 'expo-file-system';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { base64ToArrayBuffer } from '@/lib/binaryUtils';
import { type Submission } from '@/types/database';

export interface SubmitHomeworkInput {
  assignmentId: string;
  studentId: string;
  notes?: string;
  fileUri?: string;
  fileName?: string;
  answers?: Record<string, any>;
}

export interface GradeSubmissionInput {
  submissionId: string;
  marks: number;
  feedback: string;
  graderId: string;
}

/**
 * Fetch all submissions for an assignment.
 */
export const getSubmissionsForAssignment = async (
  assignmentId: string
): Promise<Submission[]> => {
  if (!isSupabaseConfigured || !assignmentId) return [];

  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      student:students(
        id,
        roll_number,
        user:profiles(full_name, email, avatar_url)
      )
    `)
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load submissions: ${error.message}`);
  }

  return (data || []).map((s: any) => ({
    ...s,
    student_name: s.student?.user?.full_name || 'Student',
    roll_number: s.student?.roll_number || '',
  })) as Submission[];
};

/**
 * Fetch a specific student's submission for an assignment.
 */
export const getStudentSubmission = async (
  assignmentId: string,
  studentId: string
): Promise<Submission | null> => {
  if (!isSupabaseConfigured || !assignmentId || !studentId) return null;

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch student submission: ${error.message}`);
  }

  return data as Submission | null;
};

/**
 * Submit student homework:
 * - If fileUri is provided, reads via expo-file-system and uploads to 'student-submissions'
 * - Upserts submissions row in database
 */
export const submitHomework = async (
  input: SubmitHomeworkInput
): Promise<Submission> => {
  const { assignmentId, studentId, notes, fileUri, fileName, answers = {} } = input;

  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  let storagePath: string | null = null;
  let cleanFileName: string | null = null;

  if (fileUri && fileName) {
    cleanFileName = fileName;
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const bytes = base64ToArrayBuffer(base64Data);

    const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    storagePath = `${assignmentId}/${studentId}_${Date.now()}_${sanitized}`;

    const { error: uploadError } = await supabase.storage
      .from('student-submissions')
      .upload(storagePath, bytes.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload submission file: ${uploadError.message}`);
    }
  }

  const { data, error } = await supabase
    .from('submissions')
    .upsert(
      {
        assignment_id: assignmentId,
        student_id: studentId,
        file_url: storagePath,
        file_name: cleanFileName,
        notes: notes || 'Student Solution Document',
        answers,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'assignment_id,student_id' }
    )
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to submit assignment: ${error.message}`);
  }

  return data as Submission;
};

/**
 * Grade student homework submission:
 * - Fetches assignment's total_marks to clamp score: 0 <= marks <= total_marks
 * - Updates submissions row with score, feedback, graded_at, graded_by
 * - Notifies student of graded result
 */
export const gradeSubmission = async (
  input: GradeSubmissionInput
): Promise<{ success: boolean; score: number }> => {
  const { submissionId, marks, feedback, graderId } = input;

  if (!isSupabaseConfigured) {
    return { success: true, score: marks };
  }

  // 1. Fetch submission and its assignment to determine max marks
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .select(`
      id,
      assignment_id,
      student_id,
      assignment:assignments(total_marks, title),
      student:students(user_id)
    `)
    .eq('id', submissionId)
    .single();

  if (subError || !submission) {
    throw new Error(`Submission not found: ${subError?.message}`);
  }

  const totalMarks = (submission as any)?.assignment?.total_marks ?? 100;
  const assignmentTitle = (submission as any)?.assignment?.title ?? 'Assignment';
  const studentUserId = (submission as any)?.student?.user_id;

  // Clamp marks between 0 and assignment's total_marks
  const clampedScore = Math.max(0, Math.min(marks, totalMarks));

  // 2. Update submission
  const { error: updateError } = await supabase
    .from('submissions')
    .update({
      score: clampedScore,
      feedback: feedback.trim(),
      status: 'graded',
      graded_at: new Date().toISOString(),
      graded_by: graderId,
    })
    .eq('id', submissionId);

  if (updateError) {
    throw new Error(`Failed to save grade: ${updateError.message}`);
  }

  // 3. Notify student
  if (studentUserId) {
    await supabase.from('notifications').insert({
      user_id: studentUserId,
      title: 'Homework Evaluated',
      body: `Your submission for "${assignmentTitle}" has been graded: ${clampedScore}/${totalMarks}. Feedback: ${feedback}`,
      data: { submission_id: submissionId, score: clampedScore, total_marks: totalMarks },
    });

    supabase.functions
      .invoke('send-push-notifications', {
        body: {
          instituteId: (submission as any)?.institute_id || 'a0000000-0000-0000-0000-000000000001',
          userIds: [studentUserId],
          title: 'Homework Evaluated',
          body: `Your submission for "${assignmentTitle}" has been graded: ${clampedScore}/${totalMarks}.`,
          type: 'grade_posted',
          data: { submission_id: submissionId, score: clampedScore, total_marks: totalMarks },
        },
      })
      .catch(() => null);
  }

  return { success: true, score: clampedScore };
};

export interface QuizResultQuestion {
  id: string;
  type: string;
  questionText: string;
  options?: string[];
  studentAnswer: any;
  correctOptionIndex?: number;
  expectedAnswerText?: string;
  isCorrect: boolean | null;
  marksObtained: number;
  maxMarks: number;
  explanation?: string;
}

export interface QuizSubmissionResult {
  submissionId: string;
  totalScore: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  status: 'graded' | 'submitted';
  questions: QuizResultQuestion[];
}

export interface QuestionAnalyticsItem {
  questionId: string;
  questionText: string;
  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;
  percentCorrect: number;
}

export interface QuizAnalyticsSummary {
  assignmentId: string;
  assignmentTitle: string;
  totalStudents: number;
  submittedCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  questions: QuestionAnalyticsItem[];
}

/**
 * Fetch assignment for taking a quiz.
 * Strips correctOptionIndex and expectedAnswerText so answers are never sent to student client.
 */
export const getAssignmentForTaking = async (assignmentId: string): Promise<any | null> => {
  if (!isSupabaseConfigured || !assignmentId) return null;

  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to load quiz: ${error?.message || 'Not found'}`);
  }

  const rawQuestions = Array.isArray(data.questions) ? data.questions : [];
  const sanitizedQuestions = rawQuestions.map((q: any) => ({
    id: q.id,
    type: q.type,
    questionText: q.questionText,
    options: q.options || [],
    marks: q.marks || 1,
    // Do NOT include correctOptionIndex or expectedAnswerText here
  }));

  return {
    ...data,
    questions: sanitizedQuestions,
  };
};

/**
 * Submit and auto-grade interactive DPP / quiz.
 * Compares student answers against assignment's secret answer key from the database.
 */
export const submitQuiz = async (input: {
  assignmentId: string;
  studentId: string;
  instituteId?: string;
  answers: Record<string, any>;
}): Promise<QuizSubmissionResult> => {
  const { assignmentId, studentId, instituteId, answers } = input;

  if (!isSupabaseConfigured) {
    return {
      submissionId: 'mock-sub-id',
      totalScore: 8,
      totalMarks: 10,
      percentage: 80,
      isPassed: true,
      status: 'graded',
      questions: [],
    };
  }

  // 1. Attempt secure PostgreSQL RPC auto-grading first (SEC-008)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('submit_and_grade_quiz', {
      p_assignment_id: assignmentId,
      p_student_id: studentId,
      p_answers: answers,
    });

    if (!rpcError && rpcData && typeof rpcData === 'object' && 'submissionId' in rpcData) {
      return rpcData as QuizSubmissionResult;
    }
  } catch (rpcErr) {
    console.warn('[SubmissionService] Note: RPC submit_and_grade_quiz fallback:', rpcErr);
  }

  // 2. Fetch assignment with question keys fallback
  const { data: assignment, error: asgError } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();

  if (asgError || !assignment) {
    throw new Error(`Quiz assignment not found: ${asgError?.message}`);
  }

  const questions: any[] = Array.isArray(assignment.questions) ? assignment.questions : [];
  let totalScore = 0;
  let totalMarks = 0;
  let hasSubjective = false;

  const detailedQuestions: QuizResultQuestion[] = questions.map((q: any) => {
    const qMarks = Number(q.marks) || 1;
    totalMarks += qMarks;
    const studentAns = answers[q.id];

    if (q.type === 'mcq' || q.type === 'true_false') {
      const isCorrect =
        studentAns !== undefined &&
        Number(studentAns) === Number(q.correctOptionIndex);

      const marksObtained = isCorrect ? qMarks : 0;
      totalScore += marksObtained;

      return {
        id: q.id,
        type: q.type,
        questionText: q.questionText,
        options: q.options || [],
        studentAnswer: studentAns,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        marksObtained,
        maxMarks: qMarks,
        explanation: q.explanation || `Correct option is ${q.options?.[q.correctOptionIndex] || 'Option ' + (q.correctOptionIndex + 1)}`,
      };
    } else {
      // Short answer / subjective question
      hasSubjective = true;
      return {
        id: q.id,
        type: q.type,
        questionText: q.questionText,
        studentAnswer: studentAns || '',
        expectedAnswerText: q.expectedAnswerText || '',
        isCorrect: null,
        marksObtained: 0,
        maxMarks: qMarks,
        explanation: 'Pending faculty grading.',
      };
    }
  });

  const finalStatus: 'graded' | 'submitted' = hasSubjective ? 'submitted' : 'graded';
  const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;

  // 2. Persist submission
  const { data: submissionData, error: subError } = await supabase
    .from('submissions')
    .upsert(
      {
        institute_id: instituteId || assignment.institute_id,
        assignment_id: assignmentId,
        student_id: studentId,
        answers,
        score: totalScore,
        marks_obtained: totalScore,
        status: finalStatus,
        submitted_at: new Date().toISOString(),
        graded_at: hasSubjective ? null : new Date().toISOString(),
      },
      { onConflict: 'assignment_id,student_id' }
    )
    .select('id')
    .single();

  if (subError) {
    throw new Error(`Failed to save quiz submission: ${subError.message}`);
  }

  return {
    submissionId: submissionData?.id || 'sub-saved',
    totalScore,
    totalMarks,
    percentage,
    isPassed: percentage >= 40,
    status: finalStatus,
    questions: detailedQuestions,
  };
};

/**
 * Fetch Quiz Analytics for teacher view (per-student and per-question breakdown).
 */
export const getQuizAnalytics = async (
  assignmentId: string
): Promise<QuizAnalyticsSummary | null> => {
  if (!isSupabaseConfigured || !assignmentId) return null;

  const { data: assignment, error: asgError } = await supabase
    .from('assignments')
    .select('id, title, total_marks, questions')
    .eq('id', assignmentId)
    .single();

  if (asgError || !assignment) return null;

  const { data: submissions = [] } = await supabase
    .from('submissions')
    .select('id, student_id, score, answers, status')
    .eq('assignment_id', assignmentId);

  const subList = submissions || [];
  const submittedCount = subList.length;
  const questions: any[] = Array.isArray(assignment.questions) ? assignment.questions : [];

  let totalScoreSum = 0;
  let highest = 0;
  let lowest = Number(assignment.total_marks) || 100;
  let passCount = 0;

  subList.forEach((s: any) => {
    const sc = Number(s.score) || 0;
    totalScoreSum += sc;
    if (sc > highest) highest = sc;
    if (sc < lowest) lowest = sc;
    const maxM = Number(assignment.total_marks) || 100;
    if (maxM > 0 && (sc / maxM) >= 0.4) passCount++;
  });

  const averageScore = submittedCount > 0 ? Math.round((totalScoreSum / submittedCount) * 10) / 10 : 0;
  const passRate = submittedCount > 0 ? Math.round((passCount / submittedCount) * 100) : 0;

  const questionAnalytics: QuestionAnalyticsItem[] = questions.map((q: any) => {
    let correct = 0;
    let incorrect = 0;

    subList.forEach((s: any) => {
      const studentAns = s.answers?.[q.id];
      if (studentAns !== undefined) {
        if (Number(studentAns) === Number(q.correctOptionIndex)) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    const totalAttempts = correct + incorrect;
    const percentCorrect = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;

    return {
      questionId: q.id,
      questionText: q.questionText,
      totalAttempts,
      correctCount: correct,
      incorrectCount: incorrect,
      percentCorrect,
    };
  });

  return {
    assignmentId,
    assignmentTitle: assignment.title,
    totalStudents: submittedCount,
    submittedCount,
    averageScore,
    highestScore: submittedCount > 0 ? highest : 0,
    lowestScore: submittedCount > 0 ? lowest : 0,
    passRate,
    questions: questionAnalytics,
  };
};

