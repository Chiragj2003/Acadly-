import { useState } from 'react';
import { Alert } from 'react-native';
import { useCommitAttendance } from '@/hooks/queries/useAttendanceQueries';
import {
  useCreateAssignment,
  useGradeSubmission,
} from '@/hooks/queries/useAssignmentQueries';
import { useUploadMaterial } from '@/hooks/queries/useMaterialQueries';
import { notifyHomeworkPublished } from '@/services/notificationService';
import { type Student360Profile } from '@/types/database';
import { type AttendanceStatus } from '@/components/ui';
import { type InteractiveQuestion } from '@/components/academic';

interface UseTeacherActionsParams {
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

  const handleCommitAttendance = async () => {
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
        instituteId: activeInstituteId || '00000000-0000-0000-0000-000000000001',
        records,
      });

      Alert.alert(
        'Attendance Committed ✅',
        `Roll call for ${activeBatchName} (${records.length} students) has been successfully saved to database.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Attendance queued locally for background sync.';
      Alert.alert('Offline Queue Active', msg);
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
    const due = new Date();
    due.setDate(due.getDate() + 2);

    await createAssignmentMutation.mutateAsync({
      batch_id: selectedBatchId,
      institute_id: activeInstituteId || '00000000-0000-0000-0000-000000000001',
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
      instituteId: activeInstituteId || '00000000-0000-0000-0000-000000000001',
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
    if (data.file.uri) {
      await uploadMaterialMutation.mutateAsync({
        fileUri: data.file.uri,
        fileName: data.file.name,
        title: data.title,
        batchId: selectedBatchId,
        category: data.category,
        instituteId: activeInstituteId || '00000000-0000-0000-0000-000000000001',
        uploadedBy: userId || '00000000-0000-0000-0000-000000000001',
      });
      Alert.alert('PDF Published! 📄', 'All linked batch students can now view and download this note.');
    }
  };

  const handleCreateAssignment = async (data: {
    title: string;
    subject: string;
    maxMarks: number;
    dueDays: number;
    pdfName?: string;
  }) => {
    const due = new Date();
    due.setDate(due.getDate() + data.dueDays);

    await createAssignmentMutation.mutateAsync({
      batch_id: selectedBatchId,
      institute_id: activeInstituteId || '00000000-0000-0000-0000-000000000001',
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
      question_paper_url: data.pdfName ? `https://storage.acadly.app/${data.pdfName}` : undefined,
    });
    Alert.alert('DPP Created! ⚡', 'Assignment published with instant push notification to batch.');
  };

  const handleAddLecture = async (data: { title: string; subject: string; videoId: string; duration: number }) => {
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
    await gradeSubmissionMutation.mutateAsync({
      submissionId,
      marks: score,
      feedback,
      graderId: userId || 'teacher',
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
