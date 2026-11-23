import React, { useState } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { Home, CalendarDays, PencilLine, ChartLine, MessageCircle, BookOpen, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ScreenWrapper,
  BottomTabBar,
  type TabItem,
  OnboardingWalkthroughModal,
  Mascot,
  DisplayTitle,
  Eyebrow,
  Avatar,
  initialsOf,
} from '@/components/ui';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { useMyStudentRecord } from '@/hooks/queries/useStudentQueries';
import { useStudentEnrollments } from '@/hooks/queries/useBatchQueries';
import { StudentToday } from '@/components/screens/student/StudentToday';
import { StudentLibrary } from '@/components/screens/student/StudentLibrary';
import { StudentProgress } from '@/components/screens/student/StudentProgress';
import { StudentScheduleSection } from '@/components/screens/student/StudentScheduleSection';
import { StudentProfileSection } from '@/components/screens/student/StudentProfileSection';
import { StudentResultsCard } from '@/components/academic/StudentResultsCard';
import { StudentAnnouncementFeed } from '@/components/academic/StudentAnnouncementFeed';
import { AssignmentsModule } from '@/components/academic/AssignmentsModule';
import { confirmAction } from '@/lib/confirm';

export default function PinterestStudentScreen() {
  const { t } = useTranslation();
  const { isAuthorized, isLoading } = useRoleGuard(['student']);
  const router = useRouter();
  const { user, activeInstitute, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'home' | 'schedule' | 'academics' | 'library' | 'performance' | 'profile'>('home');

  // Load the signed-in user's own student record (by students.user_id). Never fall
  // back to another student's record or to hard-coded demo IDs.
  const { data: myRecord, isLoading: isRecordLoading } = useMyStudentRecord(activeInstitute?.id, user?.id);
  const currentStudent = myRecord
    ? { id: myRecord.id, rollNumber: myRecord.roll_number, parentLinkCode: myRecord.parent_link_code }
    : undefined;

  const { data: enrollments = [] } = useStudentEnrollments(currentStudent?.id);
  const activeEnrollment = enrollments[0];
  const batchId = activeEnrollment?.batch_id;
  const batchName = activeEnrollment?.batch_name || t('student.noBatch', 'Not in a batch yet');

  const studentName = user?.full_name || t('student.defaultName', 'Student');

  const handleSignOut = () =>
    confirmAction(
      t('common.signOut', 'Sign out'),
      t('student.signOutPrompt', 'Sign out of Acadly on this device?'),
      t('common.signOut', 'Sign out'),
      async () => {
        await signOut();
        router.replace('/auth');
      }
    );

  const tabs: TabItem[] = [
    { key: 'home', label: t('student.today', 'Today'), icon: (color, size) => <Home color={color} size={size} /> },
    { key: 'academics', label: t('student.practice', 'Practice'), icon: (color, size) => <PencilLine color={color} size={size} /> },
    { key: 'library', label: t('student.library', 'Library'), icon: (color, size) => <BookOpen color={color} size={size} /> },
    { key: 'performance', label: t('student.progress', 'Progress'), icon: (color, size) => <ChartLine color={color} size={size} /> },
  ];

  const initials = initialsOf(studentName) || 'S';
  const firstName = studentName.split(' ')[0];

  const pageTitles: Record<Exclude<typeof activeTab, 'home'>, string> = {
    schedule: t('student.schedule', 'Schedule'),
    academics: t('student.practice', 'Practice'),
    library: t('student.library', 'Library'),
    performance: t('student.progress', 'Progress'),
    profile: t('student.account', 'Account'),
  };

  if (isLoading || !isAuthorized) {
    return (
      <ScreenWrapper scrollable={false}>
        <View className="flex-1 items-center justify-center p-8 gap-4">
          <Mascot mood="sleepy" size="lg" />
          <Text className="text-sm text-muted font-sans">
            {t('student.verifyingEnrollment', 'Checking your enrolment…')}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!isRecordLoading && !currentStudent) {
    return (
      <ScreenWrapper scrollable={false}>
        <View className="flex-1 items-center justify-center p-8 gap-4">
          <Mascot mood="curious" size="xl" />
          <DisplayTitle center>{t('student.notEnrolledTitle', 'You’re not in a class yet')}</DisplayTitle>
          <Text className="text-[15px] font-sans text-slate-600 text-center">
            {t('student.notEnrolledBody', 'Join your institute with the class code from your teacher.')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/join-institute')}
            className="mt-2 px-6 min-h-[56px] justify-center rounded-full bg-ink active:opacity-90"
          >
            <Text className="text-white font-sans-bold text-[17px]">{t('student.joinWithCode', 'Join with a code')}</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      contentContainerClassName="gap-5 px-5 pt-4"
      footer={
        <BottomTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as typeof activeTab)}
          trailingAction={{
            label: t('student.openChat', 'Messages'),
            icon: (color, size) => <MessageCircle color={color} size={size} fill={color} />,
            onPress: () => router.push('/chat'),
          }}
        />
      }
    >
      {activeTab === 'home' ? (
        <>
          <StudentToday
            firstName={firstName}
            initials={initials}
            studentId={currentStudent?.id}
            batchId={batchId}
            batchName={batchName}
            onOpenProfile={() => setActiveTab('profile')}
            onOpenSchedule={() => setActiveTab('schedule')}
            onOpenPractice={() => setActiveTab('academics')}
            onOpenDoubts={() => router.push('/community')}
            onJoinLive={() => router.push('/chat')}
          />
          <StudentAnnouncementFeed instituteId={activeInstitute?.id} batchId={batchId} />
        </>
      ) : (
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Eyebrow>{batchName}</Eyebrow>
            <DisplayTitle>{pageTitles[activeTab]}</DisplayTitle>
          </View>
          {activeTab === 'schedule' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('student.backToToday', 'Back to Today')}
              onPress={() => setActiveTab('home')}
              className="w-12 h-12 rounded-full bg-white items-center justify-center"
            >
              <ChevronLeft size={22} color="#1C1C1E" />
            </Pressable>
          ) : activeTab !== 'profile' && (
            <Avatar initials={initials} tone="pink" onPress={() => setActiveTab('profile')} label={t('student.account', 'Account')} />
          )}
        </View>
      )}

      {activeTab === 'schedule' && (
        <StudentScheduleSection batchId={batchId} onJoinLiveStream={() => router.push('/chat')} />
      )}

      {activeTab === 'library' && <StudentLibrary instituteId={activeInstitute?.id} batchId={batchId} />}

      {activeTab === 'academics' && <AssignmentsModule batchId={batchId} studentRecordId={currentStudent?.id} />}

      {activeTab === 'performance' && (
        <View className="gap-6">
          <StudentProgress studentId={currentStudent?.id} batchId={batchId} onPractice={() => setActiveTab('academics')} />
          <StudentResultsCard studentId={currentStudent?.id ?? ''} studentName={studentName} />
        </View>
      )}

      {activeTab === 'profile' && (
        <StudentProfileSection
          name={studentName}
          email={user?.email ?? ''}
          rollNumber={currentStudent?.rollNumber ?? ''}
          parentLinkCode={currentStudent?.parentLinkCode ?? ''}
          batchName={batchName}
          onSignOut={handleSignOut}
        />
      )}

      <OnboardingWalkthroughModal role="student" />
    </ScreenWrapper>
  );
}
