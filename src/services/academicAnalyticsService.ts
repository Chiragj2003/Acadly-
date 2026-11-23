import { calculateAttendancePercentage, type AttendanceItem } from '@/lib/academicHelpers';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type ExamResult, type Examination } from '@/types/database';

export interface AttendanceTrendData {
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
  streak: number;
  recentRecords: {
    date: string;
    status: 'P' | 'A' | 'L' | 'E';
    remarks?: string;
  }[];
}

export interface SubjectMasteryItem {
  subject: string;
  totalExams: number;
  averagePercentage: number;
  highestPercentage: number;
  masteryLevel: 'Mastered' | 'Proficient' | 'Developing' | 'Needs Attention';
  colorHex: string;
}

export interface StudentExamReport {
  overallPercentage: number;
  totalExamsTaken: number;
  rankInBatch?: number;
  subjectMastery: SubjectMasteryItem[];
  recentResults: {
    resultId: string;
    examId: string;
    title: string;
    subject: string;
    examDate: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    grade?: string;
    remarks?: string;
    batchAverage?: number;
  }[];
}

export interface RecordExamMarksInput {
  examinationId?: string;
  instituteId: string;
  batchId: string;
  subjectId?: string;
  title: string;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  marks: {
    studentId: string;
    marksObtained: number;
    isAbsent?: boolean;
    remarks?: string;
  }[];
}

/**
 * Compute real attendance trend for a student.
 */
export async function computeAttendanceTrend(
  studentId: string,
  batchId?: string
): Promise<AttendanceTrendData> {
  if (!isSupabaseConfigured || !studentId) {
    return {
      totalClasses: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      attendanceRate: 0,
      streak: 0,
      recentRecords: [],
    };
  }

  let query = supabase
    .from('attendance')
    .select('date, status, remarks')
    .eq('student_id', studentId)
    .order('date', { ascending: false });

  if (batchId) {
    query = query.eq('batch_id', batchId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to compute attendance trend: ${error.message}`);
  }

  const records = data || [];
  const totalClasses = records.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  records.forEach((r) => {
    if (r.status === 'P') presentCount++;
    else if (r.status === 'A') absentCount++;
    else if (r.status === 'L') lateCount++;
    else if (r.status === 'E') excusedCount++;
  });

  // Use the shared, unit-tested rule (Late = half, Excused left out of the total)
  // so every screen shows the same percentage for the same student.
  const attendanceRate = Math.round(
    calculateAttendancePercentage(
      records.map((r) => ({ status: (r.status === 'E' ? 'excused' : r.status) as AttendanceItem['status'] }))
    )
  );

  // Compute streak of presence from latest to past
  let streak = 0;
  for (const r of records) {
    if (r.status === 'P') {
      streak++;
    } else if (r.status === 'E') {
      // Approved leave neither extends nor breaks the streak.
      continue;
    } else {
      break;
    }
  }

  return {
    totalClasses,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendanceRate,
    streak,
    recentRecords: records.slice(0, 14).map((r) => ({
      date: r.date,
      status: r.status as 'P' | 'A' | 'L' | 'E',
      remarks: r.remarks || undefined,
    })),
  };
}

/** Rank in the latest (by exam date) non-absent result; 0 when there is none. */
function latestRank(
  rows: { batch_rank?: number | null; is_absent?: boolean | null; examination?: unknown }[]
): number {
  const dateOf = (r: { examination?: unknown }) => {
    const ex = Array.isArray(r.examination) ? r.examination[0] : r.examination;
    return ex && typeof ex === 'object' && 'exam_date' in ex ? String((ex as { exam_date: string }).exam_date) : '';
  };
  const ranked = rows.filter((r) => !r.is_absent && (r.batch_rank ?? 0) > 0);
  ranked.sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
  return ranked[0]?.batch_rank ?? 0;
}

/**
 * Compute subject mastery and comprehensive academic exam report for a student.
 */
export async function computeSubjectMastery(
  studentId: string
): Promise<StudentExamReport> {
  if (!isSupabaseConfigured || !studentId) {
    return {
      overallPercentage: 0,
      totalExamsTaken: 0,
      subjectMastery: [],
      recentResults: [],
    };
  }

  const { data: results, error } = await supabase
    .from('results')
    .select(`
      id,
      examination_id,
      marks_obtained,
      percentage,
      batch_rank,
      grade,
      is_absent,
      remarks,
      examination:examinations (
        id,
        title,
        exam_date,
        max_marks,
        batch_average_marks,
        subject:subjects (
          name,
          color_hex
        )
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to compute subject mastery: ${error.message}`);
  }

  const rawResults = results || [];
  if (rawResults.length === 0) {
    return {
      overallPercentage: 0,
      totalExamsTaken: 0,
      subjectMastery: [],
      recentResults: [],
    };
  }

  // Aggregate by subject
  const subjectAggregates: Record<
    string,
    { totalPercentage: number; count: number; maxPercentage: number; colorHex: string }
  > = {};

  let totalPercentageSum = 0;
  const recentResults: StudentExamReport['recentResults'] = [];

  rawResults.forEach((r) => {
    const exam = Array.isArray(r.examination) ? r.examination[0] : r.examination;
    const subject = exam && 'subject' in exam && exam.subject
      ? (Array.isArray(exam.subject) ? exam.subject[0] : exam.subject)
      : null;

    const subjectName = (subject && 'name' in subject ? String(subject.name) : '') || 'Core Academics';
    const colorHex = (subject && 'color_hex' in subject ? String(subject.color_hex) : '') || '#2563eb';
    const percent = Number(r.percentage) || 0;

    totalPercentageSum += percent;

    if (!subjectAggregates[subjectName]) {
      subjectAggregates[subjectName] = {
        totalPercentage: 0,
        count: 0,
        maxPercentage: 0,
        colorHex,
      };
    }

    subjectAggregates[subjectName].totalPercentage += percent;
    subjectAggregates[subjectName].count += 1;
    if (percent > subjectAggregates[subjectName].maxPercentage) {
      subjectAggregates[subjectName].maxPercentage = percent;
    }

    recentResults.push({
      resultId: r.id,
      examId: r.examination_id,
      title: (exam && 'title' in exam ? String(exam.title) : '') || 'Examination',
      subject: subjectName,
      examDate: (exam && 'exam_date' in exam ? String(exam.exam_date) : '') || '',
      marksObtained: Number(r.marks_obtained) || 0,
      maxMarks: Number(exam && 'max_marks' in exam ? exam.max_marks : 100),
      percentage: percent,
      grade: r.grade || undefined,
      remarks: r.remarks || undefined,
      batchAverage: Number(exam && 'batch_average_marks' in exam ? exam.batch_average_marks : 0),
    });
  });

  const subjectMastery: SubjectMasteryItem[] = Object.keys(subjectAggregates).map((sub) => {
    const agg = subjectAggregates[sub];
    const avg = Math.round((agg.totalPercentage / agg.count) * 10) / 10;
    let masteryLevel: SubjectMasteryItem['masteryLevel'] = 'Needs Attention';
    if (avg >= 85) masteryLevel = 'Mastered';
    else if (avg >= 70) masteryLevel = 'Proficient';
    else if (avg >= 50) masteryLevel = 'Developing';

    return {
      subject: sub,
      totalExams: agg.count,
      averagePercentage: avg,
      highestPercentage: agg.maxPercentage,
      masteryLevel,
      colorHex: agg.colorHex,
    };
  });

  const overallPercentage =
    rawResults.length > 0 ? Math.round((totalPercentageSum / rawResults.length) * 10) / 10 : 0;

  return {
    overallPercentage,
    totalExamsTaken: rawResults.length,
    // Rank in the most recent test the student sat (0 = no ranked result yet; it used to default to 1).
    rankInBatch: latestRank(rawResults),
    subjectMastery,
    recentResults,
  };
}

/**
 * Teacher/Admin: Record examination and enter batch marks.
 */
export async function recordExamMarks(
  input: RecordExamMarksInput,
  recordedByUserId?: string
): Promise<{ examinationId: string; recordedCount: number }> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  // 1. Create or update examination
  let examId = input.examinationId;
  const totalMaxMarks = input.maxMarks || 100;
  const passingMarks = input.passingMarks || Math.round(totalMaxMarks * 0.4);

  // Compute stats
  let totalScore = 0;
  let highestScore = 0;
  let activeStudentCount = 0;

  input.marks.forEach((m) => {
    if (!m.isAbsent) {
      activeStudentCount++;
      totalScore += m.marksObtained;
      if (m.marksObtained > highestScore) highestScore = m.marksObtained;
    }
  });

  const batchAverage = activeStudentCount > 0 ? Math.round((totalScore / activeStudentCount) * 10) / 10 : 0;

  if (!examId) {
    const { data: newExam, error: examErr } = await supabase
      .from('examinations')
      .insert({
        institute_id: input.instituteId,
        batch_id: input.batchId,
        subject_id: input.subjectId || null,
        title: input.title.trim(),
        exam_date: input.examDate,
        max_marks: totalMaxMarks,
        passing_marks: passingMarks,
        batch_average_marks: batchAverage,
        batch_highest_marks: highestScore,
        is_published: true,
      })
      .select('id')
      .single();

    if (examErr || !newExam) {
      throw new Error(`Failed to create examination: ${examErr?.message}`);
    }
    examId = newExam.id;
  } else {
    await supabase
      .from('examinations')
      .update({
        title: input.title.trim(),
        max_marks: totalMaxMarks,
        passing_marks: passingMarks,
        batch_average_marks: batchAverage,
        batch_highest_marks: highestScore,
      })
      .eq('id', examId);
  }

  // 2. Compute rankings among submitted marks
  const sorted = [...input.marks].sort((a, b) => b.marksObtained - a.marksObtained);
  const rankMap = new Map<string, number>();
  sorted.forEach((m, idx) => {
    rankMap.set(m.studentId, idx + 1);
  });

  // 3. Upsert results
  const resultRows = input.marks.map((m) => {
    const percentage = totalMaxMarks > 0 ? Math.round((m.marksObtained / totalMaxMarks) * 1000) / 10 : 0;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    return {
      institute_id: input.instituteId,
      examination_id: examId!,
      student_id: m.studentId,
      marks_obtained: m.marksObtained,
      percentage,
      batch_rank: rankMap.get(m.studentId) || 1,
      grade,
      is_absent: Boolean(m.isAbsent),
      remarks: m.remarks ? m.remarks.trim() : null,
      recorded_by: recordedByUserId || null,
    };
  });

  const { error: resultsErr } = await supabase
    .from('results')
    .upsert(resultRows, { onConflict: 'examination_id,student_id' });

  if (resultsErr) {
    throw new Error(`Failed to record marks: ${resultsErr.message}`);
  }

  return { examinationId: examId as string, recordedCount: resultRows.length };
}
