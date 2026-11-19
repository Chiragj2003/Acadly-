import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Alert, ActivityIndicator, Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Home,
  ClipboardCheck,
  Plus,
  Inbox,
  GraduationCap,
  MessageCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useBatchStore, useModalStore } from '@/stores';
import { useAttendance } from '@/hooks/queries/useAttendanceQueries';
import { useBatches } from '@/hooks/queries/useBatchQueries';
import { useStudentsRoster } from '@/hooks/queries/useStudentQueries';
import { useJoinRequests } from '@/hooks/queries/useAdmissionQueries';
import {
  useAssignments,
  useBatchSubmissions,
} from '@/hooks/queries/useAssignmentQueries';
import {
  ScreenWrapper,
  BottomTabBar,
  type TabItem,
  type AttendanceStatus,
  NotificationCenterModal,
  OnboardingWalkthroughModal,
} from '@/components/ui';
import { type PDFDocumentContent } from '@/services/dummyPdfService';
import { type AttendanceRecord, type Submission } from '@/types/database';
import {
  TeacherBatchFocus,
  TeacherHomeTab,
  TeacherAttendanceTab,
  TeacherPublishTab,
  TeacherExamsChatTab,
  TeacherProfileTab,
  TeacherScreenModals,
  useTeacherActions,
} from '@/components/screens/teacher';
import { TeacherToday } from '@/components/screens/teacher/TeacherToday';

export default function TeacherScreen() {
  const { t } = useTranslation();
  const { isAuthorized, isLoading } = useRoleGuard(['teacher', 'admin']);
  const router = useRouter();
  const { user, activeInstitute, signOut } = useAuth();
  const {
    teacherMode,
    setTeacherMode,
    linkedCoachingCode,
    linkToCoachingCenter,
    teacherProfile,
    addLecture,
    recordTestMarks,
  } = useUI();

  // Zustand stores for global batch & modal state
  const { selectedBatchId: globalBatchId, setSelectedBatchId: setGlobalBatchId } = useBatchStore();
  const {
    isScheduleEditorOpen,
    setScheduleEditorOpen,
    isMarksEntryOpen,
    setMarksEntryOpen,
  } = useModalStore();

  // Dynamic Batches from DB
  const { data: dbBatches = [] } = useBatches(activeInstitute?.id);
  const batchesList = useMemo(() => {
    return dbBatches.map((b) => ({
      id: b.id,
      name: b.name,
      time: b.start_time && b.end_time ? `${b.start_time} - ${b.end_time}` : '',
      subject: b.subject || '',
      room: b.room_number || '',
      count: b.student_count || 0,
    }));
  }, [dbBatches]);

  const activeBatch = useMemo(() => {
    if (batchesList.length === 0) {
      // No batches yet: use an empty id so batch-scoped queries stay disabled
      // instead of querying a fake UUID.
      return {
        id: '',
        name: t('teacher.noBatch', 'No batch yet'),
        time: '',
        subject: '',
        room: '',
        count: 0,
      };
    }
    return batchesList.find((b) => b.id === globalBatchId) || batchesList[0];
  }, [batchesList, globalBatchId, t]);

  const selectedBatchId = activeBatch.id;

  const handleSelectBatch = useCallback((id: string) => {
    setGlobalBatchId(id);
  }, [setGlobalBatchId]);

  // Attendance & Roster queries
  // Local calendar date (toISOString() is UTC and gives yesterday's date in IST before 5:30 AM).
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const { data: dbAttendance, isLoading: isAttendanceLoading } = useAttendance(selectedBatchId, todayStr);
  const { data: studentsRoster = [] } = useStudentsRoster(activeInstitute?.id, selectedBatchId);
  const { data: joinRequests = [] } = useJoinRequests(activeInstitute?.id);
  const { data: assignments = [] } = useAssignments(selectedBatchId);
  // Previously useSubmissions() was called with no assignment id, so it never ran.
  const { data: submissions = [] } = useBatchSubmissions(selectedBatchId || undefined);

  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [waParentPing, setWaParentPing] = useState(true);
  const [localFeeOverrides, setLocalFeeOverrides] = useState<Record<string, string>>({});
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Rebuild the local roll call whenever the batch or its saved records change.
  // Previously the map was only replaced when records existed, so marks from the
  // previous batch leaked into a batch with no attendance yet.
  useEffect(() => {
    const initialMap: Record<string, AttendanceStatus> = {};
    (dbAttendance ?? []).forEach((rec) => {
      initialMap[rec.student_id] = rec.status === 'E' ? 'P' : (rec.status as AttendanceStatus);
    });
    setLocalAttendance(initialMap);
  }, [dbAttendance, selectedBatchId]);

  const {
    isSyncing,
    handleCommitAttendance,
    handlePublishInteractiveDpp,
    handleUploadPdf,
    handleCreateAssignment,
    handleAddLecture,
    handleGradeSubmission,
  } = useTeacherActions({
    notifyParentsOfAbsence: waParentPing,
    selectedBatchId,
    activeBatchName: activeBatch.name,
    activeInstituteId: activeInstitute?.id,
    teacherFullName: user?.full_name || teacherProfile.fullName,
    userId: user?.id,
    studentsRoster,
    localAttendance,
    todayStr,
    addLecture,
  });

  // Tab & UI state
  const [activeTab, setActiveTab] = useState<'home' | 'roster' | 'publish' | 'exams_chat' | 'profile'>('home');
  const [selectedCorrectionRecord, setSelectedCorrectionRecord] = useState<AttendanceRecord | null>(null);

  // Local Modal States
  const [isDualModeOpen, setIsDualModeOpen] = useState(false);
  const [isUploadPdfOpen, setIsUploadPdfOpen] = useState(false);
  const [isExamMarksOpen, setIsExamMarksOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [isInteractiveDppOpen, setIsInteractiveDppOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [selectedReaderDoc, setSelectedReaderDoc] = useState<PDFDocumentContent | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);

  const pendingJoinCount = joinRequests.filter((r) => r.status === 'pending').length;

  const initials = (user?.full_name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  // There is no clipboard module in the app, so "copy" opens the share sheet
  // instead of claiming the code was copied.
  const shareTeacherCode = () => {
    Share.share({ message: `${t('teacher.codeShareLabel', 'Teacher code')}: ${teacherProfile.teacherCode}` }).catch(() => null);
  };

  const handleStatusChange = useCallback((studentId: string, status: AttendanceStatus) => {
    setLocalAttendance((prev) => ({ ...prev, [studentId]: status }));
  }, []);

  const handleLogout = () => {
    Alert.alert(
      t('common.signOut', 'Sign Out 🚪'),
      t('teacher.signOutPrompt', 'Are you sure you want to sign out from the Teacher Desk?'),
      [
        {
          text: t('common.signOut', 'Sign Out'),
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
      ]
    );
  };

  const papersToGrade = submissions.filter((sub) => sub.status === 'submitted').length;

  const tabs: TabItem[] = [
    {
      key: 'home',
      label: t('navigation.today', 'Today'),
      icon: (color, size) => <Home color={color} size={size} />,
    },
    {
      key: 'roster',
      label: t('navigation.rollCall', 'Roll call'),
      icon: (color, size) => <ClipboardCheck color={color} size={size} />,
    },
    {
      key: 'publish',
      label: t('navigation.publish', 'Publish'),
      icon: (color, size) => <Plus color={color} size={size} />,
      badgeCount: papersToGrade,
    },
    {
      key: 'exams_chat',
      label: t('navigation.exams', 'Exams'),
      icon: (color, size) => <Inbox color={color} size={size} />,
    },
    {
      key: 'profile',
      label: t('navigation.profile', 'Profile'),
      icon: (color, size) => <GraduationCap color={color} size={size} />,
    },
  ];


  if (isLoading || !isAuthorized) {
    return (
      <ScreenWrapper headerProps={{ title: t('teacher.soloDesk', 'Teacher Desk') }}>
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="small" color="#1C1C1E" />
          <Text className="text-xs text-slate-500 mt-2 font-sans">
            {t('common.loading', 'Verifying authorization...')}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      headerProps={{
        title: teacherMode === 'solo' ? t('teacher.soloDesk', 'My tuition') : t('teacher.facultyDesk', 'Teacher desk'),
        instituteName: teacherMode === 'solo' ? t('teacher.privateTuition', 'Private tuition') : (activeInstitute?.name || ''),
        variant: 'calm',
        profileInitials: initials,
        onNotificationPress: () => setIsNotificationOpen(true),
        onProfilePress: handleLogout,
        onLogoutPress: handleLogout,
      }}
      contentContainerClassName="gap-5 px-5 py-3"
      footer={
        <BottomTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as typeof activeTab)}
          trailingAction={{
            label: t('teacher.messages', 'Messages'),
            icon: (color, size) => <MessageCircle color={color} size={size} fill={color} />,
            onPress: () => router.push('/chat'),
          }}
        />
      }
    >
      {activeTab === 'home' && (
        <TeacherToday
          firstName={(user?.full_name || '').split(' ')[0] || t('teacher.there', 'there')}
          batchId={selectedBatchId || undefined}
          batchName={activeBatch.name}
          studentCount={studentsRoster.length}
          papersToGrade={papersToGrade}
          pendingJoinCount={pendingJoinCount}
          onRollCall={() => setActiveTab('roster')}
          onGoLive={() => router.push('/chat')}
          onPostDpp={() => setIsInteractiveDppOpen(true)}
          onUploadNotes={() => setIsUploadPdfOpen(true)}
          onEnterMarks={() => setMarksEntryOpen(true)}
          onAnnounce={() => setIsAnnouncementOpen(true)}
          onGrade={() => setActiveTab('publish')}
          onReviewRequests={() => router.push('/verify-students')}
          onOpenDoubts={() => router.push('/community')}
        />
      )}

      <TeacherBatchFocus
        batches={batchesList}
        selectedBatchId={selectedBatchId}
        onSelectBatch={handleSelectBatch}
        currentBatch={activeBatch}
      />

      {activeTab === 'home' && (
        <TeacherHomeTab
          teacherMode={teacherMode}
          teacherProfile={teacherProfile}
          pendingJoinCount={pendingJoinCount}
          onOpenDualMode={() => setIsDualModeOpen(true)}
          onCopyTeacherCode={shareTeacherCode}
          onShareTeacherCode={shareTeacherCode}
          onReviewPending={() => router.push('/verify-students')}
          onNavigateTab={setActiveTab}
          onOpenCreateDpp={() => setIsCreateAssignmentOpen(true)}
          onOpenMarksEntry={() => setMarksEntryOpen(true)}
          onOpenChat={() => router.push('/chat')}
          onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
        />
      )}

      {activeTab === 'roster' && (
        <TeacherAttendanceTab
          batchName={activeBatch.name}
          batchId={selectedBatchId}
          students={studentsRoster}
          localAttendance={localAttendance}
          savedRecords={dbAttendance ?? []}
          isLoading={isAttendanceLoading}
          isSyncing={isSyncing}
          waParentPing={waParentPing}
          onWaParentPingChange={setWaParentPing}
          onStatusChange={handleStatusChange}
          onCorrect={(rec) => setSelectedCorrectionRecord(rec)}
          onViewDetail={(id) => router.push({ pathname: '/student-detail', params: { studentId: id } })}
          onCommit={handleCommitAttendance}
        />
      )}

      {activeTab === 'publish' && (
        <TeacherPublishTab
          batchName={activeBatch.name}
          onOpenMarksEntry={() => setMarksEntryOpen(true)}
          submissions={submissions}
          assignments={assignments}
          onOpenInteractiveDpp={() => setIsInteractiveDppOpen(true)}
          onOpenUploadPdf={() => setIsUploadPdfOpen(true)}
          onOpenCreateAssignment={() => setIsCreateAssignmentOpen(true)}
          onOpenAddLecture={() => setIsAddLectureOpen(true)}
          onSelectReaderDoc={setSelectedReaderDoc}
          onOpenGrading={(sub) => setGradingSubmission(sub)}
        />
      )}

      {activeTab === 'exams_chat' && (
        <TeacherExamsChatTab
          batchName={activeBatch.name}
          students={studentsRoster}
          onOpenMarksModal={() => setMarksEntryOpen(true)}
          onOpenChat={() => router.push('/chat')}
          onOpenCommunity={() => router.push('/community')}
        />
      )}

      {activeTab === 'profile' && (
        <TeacherProfileTab
          teacherProfile={teacherProfile}
          teacherMode={teacherMode}
          batchesList={batchesList}
          selectedBatchId={selectedBatchId}
          studentsRoster={studentsRoster}
          localFeeOverrides={localFeeOverrides}
          onSelectBatch={handleSelectBatch}
          onShareTeacherCode={shareTeacherCode}
          onOpenDualMode={() => setIsDualModeOpen(true)}
          onOpenScheduleEditor={() => setScheduleEditorOpen(true)}
          onUpdateFeeStatus={(stId, st) => setLocalFeeOverrides((prev) => ({ ...prev, [stId]: st }))}
          onViewStudentDetail={(id) => router.push({ pathname: '/student-detail', params: { studentId: id } })}
          onLogout={handleLogout}
        />
      )}

      <TeacherScreenModals
        isDualModeOpen={isDualModeOpen}
        onCloseDualMode={() => setIsDualModeOpen(false)}
        teacherMode={teacherMode}
        linkedCoachingCode={linkedCoachingCode}
        onSelectSolo={() => setTeacherMode('solo')}
        onLinkCoaching={linkToCoachingCenter}
        isUploadPdfOpen={isUploadPdfOpen}
        onCloseUploadPdf={() => setIsUploadPdfOpen(false)}
        onUploadPdf={handleUploadPdf}
        isExamMarksOpen={isExamMarksOpen}
        onCloseExamMarks={() => setIsExamMarksOpen(false)}
        studentsRoster={studentsRoster}
        onRecordTestMarks={recordTestMarks}
        isMarksEntryOpen={isMarksEntryOpen}
        onCloseMarksEntry={() => setMarksEntryOpen(false)}
        selectedBatchId={selectedBatchId}
        activeBatchName={activeBatch.name}
        instituteId={activeInstitute?.id}
        isScheduleEditorOpen={isScheduleEditorOpen}
        onCloseScheduleEditor={() => setScheduleEditorOpen(false)}
        gradingSubmission={gradingSubmission}
        gradingAssignment={assignments.find((a) => a.id === gradingSubmission?.assignment_id)}
        onCloseGrading={() => setGradingSubmission(null)}
        onGradeSubmission={handleGradeSubmission}
        isCreateAssignmentOpen={isCreateAssignmentOpen}
        onCloseCreateAssignment={() => setIsCreateAssignmentOpen(false)}
        onCreateAssignment={handleCreateAssignment}
        isAddLectureOpen={isAddLectureOpen}
        onCloseAddLecture={() => setIsAddLectureOpen(false)}
        onAddLecture={handleAddLecture}
        selectedCorrectionRecord={selectedCorrectionRecord}
        onCloseCorrection={() => setSelectedCorrectionRecord(null)}
        selectedReaderDoc={selectedReaderDoc}
        onCloseReaderDoc={() => setSelectedReaderDoc(null)}
        isInteractiveDppOpen={isInteractiveDppOpen}
        onCloseInteractiveDpp={() => setIsInteractiveDppOpen(false)}
        onPublishInteractiveDpp={handlePublishInteractiveDpp}
        activeBatchSubject={activeBatch.subject}
        isAnnouncementOpen={isAnnouncementOpen}
        onCloseAnnouncement={() => setIsAnnouncementOpen(false)}
      />
      <NotificationCenterModal
        visible={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
      <OnboardingWalkthroughModal role="teacher" />
    </ScreenWrapper>
  );
}
