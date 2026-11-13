import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Sparkles, Clock, BookOpen, Award, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, BottomTabBar, type TabItem, OnboardingWalkthroughModal } from '@/components/ui';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { useStudentsRoster } from '@/hooks/queries/useStudentQueries';
import { StudentHeader } from '@/components/screens/student/StudentHeader';
import { StudentScheduleSection } from '@/components/screens/student/StudentScheduleSection';
import { StudentAttendanceSection } from '@/components/screens/student/StudentAttendanceSection';
import { StudentProfileSection } from '@/components/screens/student/StudentProfileSection';
import { StudentResultsCard } from '@/components/academic/StudentResultsCard';
import { StudentAnnouncementFeed } from '@/components/academic/StudentAnnouncementFeed';
import { AssignmentsModule } from '@/components/academic/AssignmentsModule';

export default function PinterestStudentScreen() {
  const { t } = useTranslation();
  const { isAuthorized, isLoading } = useRoleGuard(['student']);
  const router = useRouter();
  const { user, activeInstitute, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'home' | 'schedule' | 'academics' | 'performance' | 'profile'>('home');

  // Query enrolled students roster to match signed in student record
  const { data: studentsRoster = [] } = useStudentsRoster(activeInstitute?.id);

  const currentStudent = studentsRoster.find((s) => s.id === user?.id) || studentsRoster[0] || {
    id: '33333333-3333-3333-3333-333333333301',
    rollNumber: 'ROLL-12-001',
    parentLinkCode: 'STU-12-AMELIA',
    class_grade: 'Class 12',
    target_exam: 'JEE Advanced',
  };

  const studentName = user?.full_name || 'Enrolled Student';
  const defaultBatchId = '55555555-5555-5555-5555-555555555501';

  const handleSignOut = () => {
    Alert.alert(
      t('common.signOut', 'Sign Out'),
      t('student.signOutPrompt', 'Are you sure you want to log out of the Student Portal?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.signOut', 'Sign Out'),
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const tabs: TabItem[] = [
    { key: 'home', label: t('student.home', 'Home'), icon: (color, size) => <Sparkles color={color} size={size} /> },
    { key: 'schedule', label: t('student.schedule', 'Schedule'), icon: (color, size) => <Clock color={color} size={size} /> },
    { key: 'academics', label: t('student.dpps', 'DPPs'), icon: (color, size) => <BookOpen color={color} size={size} /> },
    { key: 'performance', label: t('student.mastery', 'Mastery'), icon: (color, size) => <Award color={color} size={size} /> },
    { key: 'profile', label: t('student.profile', 'Profile'), icon: (color, size) => <User color={color} size={size} /> },
  ];

  if (isLoading || !isAuthorized) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-xs text-slate-500 font-medium">
            {t('student.verifyingEnrollment', 'Verifying student enrollment...')}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View className="px-4 pt-3 pb-1">
        <StudentHeader
          name={studentName}
          batchName="Class 12 • JEE Advanced (Morning)"
          onOpenChat={() => router.push('/chat')}
          onOpenCommunity={() => router.push('/community')}
          onJoinInstitute={() => router.push('/join-institute')}
        />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-3.5 px-4 py-3">
        {activeTab === 'home' && (
          <View className="gap-3.5">
            <StudentAnnouncementFeed
              instituteId={activeInstitute?.id}
              batchId={defaultBatchId}
            />
            <StudentScheduleSection
              batchId={defaultBatchId}
              onJoinLiveStream={() => router.push('/chat')}
            />
            <StudentAttendanceSection
              studentId={currentStudent.id}
              batchId={defaultBatchId}
            />
            <StudentResultsCard
              studentId={currentStudent.id}
              studentName={studentName}
            />
          </View>
        )}

        {activeTab === 'schedule' && (
          <StudentScheduleSection
            batchId={defaultBatchId}
            onJoinLiveStream={() => router.push('/chat')}
          />
        )}

        {activeTab === 'academics' && (
          <AssignmentsModule />
        )}

        {activeTab === 'performance' && (
          <View className="gap-3.5">
            <StudentAttendanceSection
              studentId={currentStudent.id}
              batchId={defaultBatchId}
            />
            <StudentResultsCard
              studentId={currentStudent.id}
              studentName={studentName}
            />
          </View>
        )}

        {activeTab === 'profile' && (
          <StudentProfileSection
            name={studentName}
            email={user?.email || 'student@example.com'}
            rollNumber={currentStudent.rollNumber}
            parentLinkCode={currentStudent.parentLinkCode}
            batchName="Class 12 • JEE Advanced (Morning)"
            onSignOut={handleSignOut}
          />
        )}
      </ScrollView>

      <BottomTabBar tabs={tabs} activeTab={activeTab} onTabChange={(t) => setActiveTab(t as typeof activeTab)} />
      <OnboardingWalkthroughModal role="student" />
    </ScreenWrapper>
  );
}
