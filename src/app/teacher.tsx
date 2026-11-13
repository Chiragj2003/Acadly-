import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Home,
  ClipboardCheck,
  Upload,
  MessageSquare,
  GraduationCap,
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
  useSubmissions,
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
      time: `${b.start_time || '04:30 PM'} - ${b.end_time || '06:00 PM'}`,
      subject: b.subject || 'Physics',
      room: b.room_number || 'Room 204',
      count: b.student_count || 0,
    }));
  }, [dbBatches]);

  const activeBatch = useMemo(() => {
    if (batchesList.length === 0) {
      return {
        id: globalBatchId || '00000000-0000-0000-0000-000000000000',
        name: 'General Batch',
        time: '04:30 PM - 06:00 PM',
        subject: 'General Science',
        room: 'Room 101',
        count: 0,
      };
    }
    return batchesList.find((b) => b.id === globalBatchId) || batchesList[0];
  }, [batchesList, globalBatchId]);

  const selectedBatchId = activeBatch.id;

  const handleSelectBatch = useCallback((id: string) => {
    setGlobalBatchId(id);
  }, [setGlobalBatchId]);

  // Attendance & Roster queries
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const { data: dbAttendance = [], isLoading: isAttendanceLoading } = useAttendance(selectedBatchId, todayStr);
  const { data: studentsRoster = [] } = useStudentsRoster(activeInstitute?.id, selectedBatchId);
  const { data: joinRequests = [] } = useJoinRequests(activeInstitute?.id);
  const { data: assignments = [] } = useAssignments(selectedBatchId);
  const { data: submissions = [] } = useSubmissions();

  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [localFeeOverrides, setLocalFeeOverrides] = useState<Record<string, string>>({});
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    if (dbAttendance && dbAttendance.length > 0) {
      const initialMap: Record<string, AttendanceStatus> = {};
      dbAttendance.forEach((rec) => {
        initialMap[rec.student_id] = rec.status === 'E' ? 'P' : (rec.status as AttendanceStatus);
      });
      setLocalAttendance(initialMap);
    }
  }, [dbAttendance]);

  const {
    isSyncing,
    handleCommitAttendance,
    handlePublishInteractiveDpp,
    handleUploadPdf,
    handleCreateAssignment,
    handleAddLecture,
    handleGradeSubmission,
  } = useTeacherActions({
    selectedBatchId,
    activeBatchName: activeBatch.name,
    activeInstituteId: activeInstitute?.id,
    teacherFullName: teacherProfile.fullName,
    userId: user?.id,
    studentsRoster,
    localAttendance,
    todayStr,
    addLecture,
  });

  // Tab & UI state
  const [activeTab, setActiveTab] = useState<'home' | 'roster' | 'publish' | 'exams_chat' | 'profile'>('home');
  const [waParentPing, setWaParentPing] = useState(true);
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

  const tabs: TabItem[] = [
    {
      key: 'home',
      label: t('navigation.home', 'Home'),
      icon: (color, size) => <Home color={color} size={size} />,
      badgeCount: pendingJoinCount > 0 ? pendingJoinCount : undefined,
    },
    {
      key: 'roster',
      label: t('navigation.roster', 'Roster'),
      icon: (color, size) => <ClipboardCheck color={color} size={size} />,
    },
    {
      key: 'publish',
      label: t('academic.assignments', 'Publish'),
      icon: (color, size) => <Upload color={color} size={size} />,
      badgeCount: submissions.filter((s) => s.status === 'submitted').length,
    },
    {
      key: 'exams_chat',
      label: t('navigation.exams', 'Exams & Chat'),
      icon: (color, size) => <MessageSquare color={color} size={size} />,
      badgeCount: 1,
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
          <ActivityIndicator size="small" color="#2563EB" />
          <Text className="text-xs text-slate-500 mt-2 font-medium">
            {t('common.loading', 'Verifying authorization...')}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      headerProps={{
        title: teacherMode === 'solo' ? t('teacher.soloDesk', 'Solo Tutor Desk') : t('teacher.facultyDesk', 'Faculty Command Desk'),
        instituteName: teacherMode === 'solo' ? 'Private Tuition' : (activeInstitute?.name || 'Academy Hub'),
        profileInitials: 'RV',
        onNotificationPress: () => setIsNotificationOpen(true),
        onProfilePress: handleLogout,
        onLogoutPress: handleLogout,
      }}
      contentContainerClassName="gap-3.5 px-4 py-4"
      footer={
        <BottomTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as any)}
          accentColor="#2563EB"
        />
      }
    >
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
          onCopyTeacherCode={() => Alert.alert('Code Copied', teacherProfile.teacherCode)}
          onShareTeacherCode={() => Alert.alert('Share Code', `Teacher Code: ${teacherProfile.teacherCode}`)}
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
          onShareTeacherCode={() => Alert.alert('Share Code', `Teacher Code: ${teacherProfile.teacherCode}`)}
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
