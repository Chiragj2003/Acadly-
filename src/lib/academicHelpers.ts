/**
 * Academic calculation utilities, date helpers, and filters
 */

export interface AttendanceItem {
  status: 'P' | 'A' | 'L' | 'present' | 'absent' | 'late' | 'excused';
}

/**
 * Calculates attendance percentage:
 * - 'P' or 'present': 1.0 weight
 * - 'L' or 'late': 0.5 weight
 * - 'A' or 'absent': 0 weight
 * - 'excused': excluded from denominator
 */
export function calculateAttendancePercentage(records: AttendanceItem[]): number {
  if (!records || records.length === 0) return 0;

  let attendedWeight = 0;
  let totalValidRecords = 0;

  for (const r of records) {
    const s = r.status.toLowerCase();
    if (s === 'excused') {
      continue; // Excused does not penalize attendance
    }
    totalValidRecords += 1;
    if (s === 'p' || s === 'present') {
      attendedWeight += 1;
    } else if (s === 'l' || s === 'late') {
      attendedWeight += 0.5;
    }
  }

  if (totalValidRecords === 0) return 0;
  const pct = (attendedWeight / totalValidRecords) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)) * 10) / 10;
}

/**
 * Clamps grade score between 0 and totalMarks.
 */
export function clampGradeScore(score: number, totalMarks: number): number {
  if (isNaN(score)) return 0;
  if (totalMarks <= 0) return 0;
  return Math.max(0, Math.min(score, totalMarks));
}

export interface QuizQuestionDef {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctOptionIndex: number;
  marks: number;
  explanation?: string;
}

export interface AutoGradedResult {
  totalScore: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  questionResults: {
    id: string;
    isCorrect: boolean;
    marksObtained: number;
    maxMarks: number;
  }[];
}

/**
 * Auto-grades quiz questions against student answers
 */
export function autoGradeQuiz(
  questions: QuizQuestionDef[],
  answers: Record<string, number | string | undefined>,
  passingPercentage: number = 40
): AutoGradedResult {
  let totalScore = 0;
  let totalMarks = 0;

  const questionResults = (questions || []).map((q) => {
    const qMarks = Number(q.marks) || 1;
    totalMarks += qMarks;
    const studentAns = answers[q.id];

    let isCorrect = false;
    let marksObtained = 0;

    if (q.type === 'mcq' || q.type === 'true_false') {
      isCorrect = studentAns !== undefined && Number(studentAns) === Number(q.correctOptionIndex);
      marksObtained = isCorrect ? qMarks : 0;
    }

    totalScore += marksObtained;

    return {
      id: q.id,
      isCorrect,
      marksObtained,
      maxMarks: qMarks,
    };
  });

  const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100 * 10) / 10 : 0;
  const isPassed = percentage >= passingPercentage;

  return {
    totalScore,
    totalMarks,
    percentage,
    isPassed,
    questionResults,
  };
}

/**
 * Validates admission join request approval logic.
 * Requires pending status, valid student UUID, and target batch UUID.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateBatchApproval(
  request: { id: string; status: string; student_id?: string; user_id?: string },
  targetBatchId: string
): { valid: boolean; reason?: string } {
  if (!request) {
    return { valid: false, reason: 'Request object is missing' };
  }
  if (request.status !== 'pending') {
    return { valid: false, reason: `Cannot approve request with status '${request.status}'` };
  }
  const studentOrUserId = request.student_id || request.user_id;
  if (!studentOrUserId || !UUID_REGEX.test(studentOrUserId)) {
    return { valid: false, reason: 'Invalid student UUID on join request' };
  }
  if (!targetBatchId || !UUID_REGEX.test(targetBatchId)) {
    return { valid: false, reason: 'Invalid target batch UUID' };
  }
  return { valid: true };
}

/**
 * Filters academic collections by debounced search string across title/name and subject
 */
export function filterAcademicItems<T extends { title?: string; name?: string; subject?: string }>(
  items: T[],
  query: string
): T[] {
  if (!items) return [];
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return items;

  return items.filter((item) => {
    const titleMatch = item.title ? item.title.toLowerCase().includes(trimmed) : false;
    const nameMatch = item.name ? item.name.toLowerCase().includes(trimmed) : false;
    const subjectMatch = item.subject ? item.subject.toLowerCase().includes(trimmed) : false;
    return titleMatch || nameMatch || subjectMatch;
  });
}

/**
 * Date helper: Format date as YYYY-MM-DD
 */
export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Check if a date string is today
 */
export function isToday(dateStr: string): boolean {
  return dateStr === toISODateString(new Date());
}
