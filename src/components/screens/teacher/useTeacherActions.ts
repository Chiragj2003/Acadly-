import { useState } from 'react';
import { Alert } from 'react-native';
import { useCommitAttendance } from '@/hooks/queries/useAttendanceQueries';
import {
  useCreateAssignment,
  useGradeSubmission,
} from '@/hooks/queries/useAssignmentQueries';
import { useUploadMaterial } from '@/hooks/queries/useMaterialQueries';
import { notifyHomeworkPublished } from '@/services/notificationService';
import { batchNotifyAbsentParents } from '@/services/attendanceService';
import { type Student360Profile } from '@/types/database';
import { type AttendanceStatus } from '@/components/ui';
import { type InteractiveQuestion } from '@/components/academic';

interface UseTeacherActionsParams {
  /** Send one batched alert to parents of absent students after saving. */
  notifyParentsOfAbsence?: boolean;
  selectedBatchId: string;
  activeBatchName: string;
  activeInstituteId?: string;
  teacherFullName: string;
  userId?: string;
  studentsRoster: Student360Profile[];
  localAttendance: Record<string, AttendanceStatus>;
  todayStr: string;
  addLecture: (data: {
    batch_id: string;
    title: string;
    subject: string;
    provider: 'youtube';
    video_id_or_url: string;
    duration_minutes: number;
    duration_formatted: string;
    faculty_name: string;
  }) => Promise<unknown>;
}

export function useTeacherActions({
  notifyParentsOfAbsence = false,
  selectedBatchId,
  activeBatchName,
  activeInstituteId,
  teacherFullName,
  userId,
  studentsRoster,
  localAttendance,
  todayStr,
  addLecture,
}: UseTeacherActionsParams) {
  const [isSyncing, setIsSyncing] = useState(false);
  const commitAttendanceMutation = useCommitAttendance();
  const createAssignmentMutation = useCreateAssignment();
  const gradeSubmissionMutation = useGradeSubmission();
  const uploadMaterialMutation = useUploadMaterial();

  /**
   * Guard for every write. Previously each write fell back to a hard-coded
   * placeholder UUID when the institute/batch/user was missing, which either
   * failed RLS with a confusing error or wrote into the dev-seed institute.
   */
  const requireWriteContext = (needsBatch = true): { instituteId: string; userId: string } | null => {
    if (!activeInstituteId || !userId) {
      Alert.alert('Not ready', 'Select an institute before publishing.');
      return null;
    }
    if (needsBatch && !selectedBatchId) {
      Alert.alert('No batch selected', 'Create or pick a batch first.');
      return null;
    }
    return { instituteId: activeInstituteId, userId };
  };

  const handleCommitAttendance = async () => {
    const ctx = requireWriteContext();
    if (!ctx) return;
    setIsSyncing(true);
    try {
      const records = studentsRoster.map((st) => ({
        studentId: st.id,
        status: (localAttendance[st.id] === 'A' ? 'A' : localAttendance[st.id] === 'L' ? 'L' : 'P') as 'P' | 'A' | 'L',
        remarks: st.teacherRemarks?.[0],
      }));

      await commitAttendanceMutation.mutateAsync({
        batchId: selectedBatchId,
        date: todayStr,
        instituteId: ctx.instituteId,
        records,
      });

      // The "Tell parents" switch used to be cosmetic; now it sends the batched alert.
      const absentCount = records.filter((r) => r.status === 'A').length;
      let notified = 0;
      if (notifyParentsOfAbsence && absentCount > 0) {
        const res = await batchNotifyAbsentParents(selectedBatchId, todayStr, ctx.instituteId).catch(() => null);
        notified = res?.notifiedCount ?? 0;
      }

      Alert.alert(
        'Roll call saved',
        `${activeBatchName}: ${records.length} students.` +
          (notifyParentsOfAbsence && absentCount > 0 ? ` ${notified} parent${notified === 1 ? '' : 's'} notified.` : '')
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Attendance not saved', msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePublishInteractiveDpp = async (dppData: {
    title: string;
    subject: string;
    batchId: string;
    totalMarks: number;
    questions: InteractiveQuestion[];
  }) => {
    const ctx = requireWriteContext();
    if (!ctx) return;
    const due = new Date();
    due.setDate(due.getDate() + 2);

    await createAssignmentMutation.mutateAsync({
      batch_id: selectedBatchId,
      institute_id: ctx.instituteId,
      title: dppData.title,
      subject: dppData.subject,
      instructions: `Interactive Quiz Form (${dppData.questions.length} Questions).`,
      description: `Interactive Quiz Form (${dppData.questions.length} Questions).`,
      due_date: due.toISOString(),
      due_label: 'Due in 2 days',
      total_marks: dppData.totalMarks,
      type: 'quiz',
      questions: dppData.questions,
      question_count: dppData.questions.length,
      created_by: teacherFullName,
    });

    notifyHomeworkPublished({
      instituteId: ctx.instituteId,
      batchId: selectedBatchId,
      title: dppData.title,
      subject: dppData.subject,
    }).catch(() => null);

    Alert.alert('In-App Quiz Published! ⚡', `Interactive DPP "${dppData.title}" is live for ${activeBatchName}.`);
  };

  const handleUploadPdf = async (data: {
    title: string;
    subject: string;
    category: 'notes' | 'formula_sheet' | 'pyq' | 'dpp';
    file: { name: string; size?: string; uri?: string };
  }) => {
    const ctx = requireWriteContext();
    if (!ctx) return;
    if (!data.file.uri) {
      Alert.alert('No file selected', 'Pick a PDF to upload.');
      return;
    }
    await uploadMaterialMutation.mutateAsync({
      fileUri: data.file.uri,
      fileName: data.file.name,
      title: data.title,
      batchId: selectedBatchId,
      category: data.category,
      instituteId: ctx.instituteId,
      uploadedBy: ctx.userId,
    });
    Alert.alert('PDF Published! 📄', 'All linked batch students can now view and download this note.');
  };

  const handleCreateAssignment = async (data: {
    title: string;
    subject: string;
    maxMarks: number;
    dueDays: number;
    pdfName?: string;
  }) => {
    const ctx = requireWriteContext();
    if (!ctx) return;
    const due = new Date();
    due.setDate(due.getDate() + data.dueDays);

    await createAssignmentMutation.mutateAsync({
      batch_id: selectedBatchId,
      institute_id: ctx.instituteId,
      title: data.title,
      subject: data.subject,
      instructions: 'Solve all problem sets and upload handwritten PDF solution.',
      description: 'Solve all problem sets and upload handwritten PDF solution.',
      due_date: due.toISOString(),
      due_label: `Due in ${data.dueDays} days`,
      total_marks: data.maxMarks,
      type: 'file',
      question_count: 5,
      created_by: teacherFullName,
      // The PDF is not uploaded in this flow, so don't fabricate a URL for it.
      question_paper_url: undefined,
    });
    Alert.alert('DPP Created! ⚡', 'Assignment published with instant push notification to batch.');
  };

  const handleAddLecture = async (data: { title: string; subject: string; videoId: string; duration: number }) => {
    if (!requireWriteContext()) return;
    await addLecture({
      batch_id: selectedBatchId,
      title: data.title,
      subject: data.subject,
      provider: 'youtube',
      video_id_or_url: data.videoId,
      duration_minutes: data.duration,
      duration_formatted: `${data.duration}m`,
      faculty_name: teacherFullName,
    });
    Alert.alert('Lecture Published', 'New video lecture linked and published to batch.');
  };

  const handleGradeSubmission = async (submissionId: string, score: number, feedback: string) => {
    const ctx = requireWriteContext(false);
    if (!ctx) return;
    await gradeSubmissionMutation.mutateAsync({
      submissionId,
      marks: score,
      feedback,
      graderId: ctx.userId,
    });
    Alert.alert('Submission Graded ✅', `Recorded ${score} marks.`);
  };

  return {
    isSyncing,
    handleCommitAttendance,
    handlePublishInteractiveDpp,
    handleUploadPdf,
    handleCreateAssignment,
    handleAddLecture,
    handleGradeSubmission,
  };
}
