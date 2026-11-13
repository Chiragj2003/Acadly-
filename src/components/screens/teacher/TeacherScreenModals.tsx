import React from 'react';
import { Alert } from 'react-native';
import {
  VideoPlayerModal,
  AttendanceCorrectionModal,
  DocumentReaderModal,
  InteractiveDppBuilderModal,
  BatchScheduleEditorModal,
  TeacherMarksEntryModal,
  AnnouncementComposerModal,
  type InteractiveQuestion,
} from '@/components/academic';
import { type PDFDocumentContent } from '@/services/dummyPdfService';
import { type AttendanceRecord, type Submission, type Student360Profile } from '@/types/database';
import {
  DualModeModal,
  UploadPdfModal,
  ExamMarksModal,
  GradingModal,
  CreateAssignmentModal,
  AddLectureModal,
} from './TeacherModals';

interface TeacherScreenModalsProps {
  // Dual Mode
  isDualModeOpen: boolean;
  onCloseDualMode: () => void;
  teacherMode: 'solo' | 'coaching_faculty';
  linkedCoachingCode?: string;
  onSelectSolo: () => void;
  onLinkCoaching: (code: string) => Promise<{ success: boolean; instituteName?: string; error?: string }>;

  // Upload PDF
  isUploadPdfOpen: boolean;
  onCloseUploadPdf: () => void;
  onUploadPdf: (data: {
    title: string;
    subject: string;
    category: 'notes' | 'formula_sheet' | 'pyq' | 'dpp';
    file: { name: string; size?: string; uri?: string };
  }) => Promise<void>;

  // Exam Marks
  isExamMarksOpen: boolean;
  onCloseExamMarks: () => void;
  studentsRoster: Student360Profile[];
  onRecordTestMarks: (name: string, subj: string, max: number, marks: { studentId: string; score: number }[]) => Promise<void>;

  // Teacher Marks Entry (Real DB)
  isMarksEntryOpen: boolean;
  onCloseMarksEntry: () => void;
  selectedBatchId: string;
  activeBatchName: string;
  instituteId?: string;

  // Batch Schedule Editor
  isScheduleEditorOpen: boolean;
  onCloseScheduleEditor: () => void;

  // Grading
  gradingSubmission: Submission | null;
  onCloseGrading: () => void;
  onGradeSubmission: (submissionId: string, score: number, feedback: string) => Promise<void>;

  // Create Assignment
  isCreateAssignmentOpen: boolean;
  onCloseCreateAssignment: () => void;
  onCreateAssignment: (data: {
    title: string;
    subject: string;
    maxMarks: number;
    dueDays: number;
    pdfName?: string;
  }) => Promise<void>;

  // Add Lecture
  isAddLectureOpen: boolean;
  onCloseAddLecture: () => void;
  onAddLecture: (data: { title: string; subject: string; videoId: string; duration: number }) => Promise<void>;

  // Correction
  selectedCorrectionRecord: AttendanceRecord | null;
  onCloseCorrection: () => void;

  // Reader Doc
  selectedReaderDoc: PDFDocumentContent | null;
  onCloseReaderDoc: () => void;

  // Interactive DPP
  isInteractiveDppOpen: boolean;
  onCloseInteractiveDpp: () => void;
  onPublishInteractiveDpp: (data: {
    title: string;
    subject: string;
    batchId: string;
    totalMarks: number;
    questions: InteractiveQuestion[];
  }) => Promise<void>;
  activeBatchSubject: string;

  // Announcement
  isAnnouncementOpen?: boolean;
  onCloseAnnouncement?: () => void;
}

export const TeacherScreenModals: React.FC<TeacherScreenModalsProps> = ({
  isDualModeOpen,
  onCloseDualMode,
  teacherMode,
  linkedCoachingCode,
  onSelectSolo,
  onLinkCoaching,

  isUploadPdfOpen,
  onCloseUploadPdf,
  onUploadPdf,

  isExamMarksOpen,
  onCloseExamMarks,
  studentsRoster,
  onRecordTestMarks,

  isMarksEntryOpen,
  onCloseMarksEntry,
  selectedBatchId,
  activeBatchName,
  instituteId,

  isScheduleEditorOpen,
  onCloseScheduleEditor,

  gradingSubmission,
  onCloseGrading,
  onGradeSubmission,

  isCreateAssignmentOpen,
  onCloseCreateAssignment,
  onCreateAssignment,

  isAddLectureOpen,
  onCloseAddLecture,
  onAddLecture,

  selectedCorrectionRecord,
  onCloseCorrection,

  selectedReaderDoc,
  onCloseReaderDoc,

  isInteractiveDppOpen,
  onCloseInteractiveDpp,
  onPublishInteractiveDpp,
  activeBatchSubject,

  isAnnouncementOpen = false,
  onCloseAnnouncement,
}) => {
  return (
    <>
      <DualModeModal
        visible={isDualModeOpen}
        onClose={onCloseDualMode}
        teacherMode={teacherMode}
        linkedCoachingCode={linkedCoachingCode}
        onSelectSolo={onSelectSolo}
        onLinkCoaching={onLinkCoaching}
      />

      <UploadPdfModal
        visible={isUploadPdfOpen}
        onClose={onCloseUploadPdf}
        onUpload={onUploadPdf}
      />

      <ExamMarksModal
        visible={isExamMarksOpen}
        onClose={onCloseExamMarks}
        students={studentsRoster}
        onSave={async (name, subj, max, marks) => {
          await onRecordTestMarks(name, subj, max, marks);
          Alert.alert('Marks Recorded', 'Live comparison charts updated across all student dashboards.');
        }}
      />

      <TeacherMarksEntryModal
        visible={isMarksEntryOpen}
        onClose={onCloseMarksEntry}
        instituteId={instituteId || '00000000-0000-0000-0000-000000000001'}
        batchId={selectedBatchId}
        batchName={activeBatchName}
        students={studentsRoster.map((s) => ({
          id: s.id,
          name: s.name,
          rollNumber: s.rollNumber,
        }))}
      />

      <BatchScheduleEditorModal
        visible={isScheduleEditorOpen}
        onClose={onCloseScheduleEditor}
        instituteId={instituteId || '00000000-0000-0000-0000-000000000001'}
        batchId={selectedBatchId}
        batchName={activeBatchName}
      />

      <GradingModal
        visible={Boolean(gradingSubmission)}
        onClose={onCloseGrading}
        submissionId={gradingSubmission?.id || null}
        initialScore={gradingSubmission?.marks_obtained || 23}
        initialFeedback={gradingSubmission?.feedback || 'Well attempted derivation steps.'}
        aiScore={gradingSubmission?.ai_score}
        aiFeedback={gradingSubmission?.ai_feedback}
        aiStatus={gradingSubmission?.ai_status}
        onGrade={onGradeSubmission}
      />

      <CreateAssignmentModal
        visible={isCreateAssignmentOpen}
        onClose={onCloseCreateAssignment}
        onCreate={onCreateAssignment}
      />

      <AddLectureModal
        visible={isAddLectureOpen}
        onClose={onCloseAddLecture}
        onAdd={onAddLecture}
      />

      <AttendanceCorrectionModal
        record={selectedCorrectionRecord}
        onClose={onCloseCorrection}
      />

      <VideoPlayerModal />

      <DocumentReaderModal
        document={selectedReaderDoc}
        visible={Boolean(selectedReaderDoc)}
        onClose={onCloseReaderDoc}
      />

      <InteractiveDppBuilderModal
        visible={isInteractiveDppOpen}
        onClose={onCloseInteractiveDpp}
        onPublish={onPublishInteractiveDpp}
        batchId={selectedBatchId}
        defaultBatchName={activeBatchName}
        defaultSubject={activeBatchSubject}
      />

      {onCloseAnnouncement && (
        <AnnouncementComposerModal
          visible={isAnnouncementOpen}
          onClose={onCloseAnnouncement}
          instituteId={instituteId || '00000000-0000-0000-0000-000000000001'}
          batchId={selectedBatchId}
          batchName={activeBatchName}
        />
      )}
    </>
  );
};
