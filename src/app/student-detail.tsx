import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { ScreenWrapper } from '@/components/ui';
import { ListLoadingSkeleton, ListEmptyState } from '@/components/ui';
import { PerformanceComparisonChart, SubjectRadarOrBarChart } from '@/components/charts';
import { useUI } from '@/context/UIContext';
import { useStudentProfile } from '@/hooks/queries/useStudentQueries';
import { StudentDetailHeader } from '@/components/screens/student-detail/StudentDetailHeader';
import { StudentBioTab } from '@/components/screens/student-detail/StudentBioTab';
import { StudentAttendanceTab } from '@/components/screens/student-detail/StudentAttendanceTab';

export default function StudentDetailScreen() {
  const { isAuthorized, isLoading: isGuardLoading } = useRoleGuard(['teacher', 'admin', 'parent']);
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const { comparisonChartData } = useUI();
  const { data: student, isLoading: isStudentLoading, error } = useStudentProfile(params.studentId);
  const [activeTab, setActiveTab] = useState<'analytics' | 'attendance' | 'bio'>('analytics');

  if (isGuardLoading || !isAuthorized) {
    return (
      <ScreenWrapper headerProps={{ title: 'Student Profile', onBackPress: () => router.back() }}>
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="small" color="#1C1C1E" />
          <Text className="text-xs text-slate-500 mt-2 font-sans">Verifying authorization...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (isStudentLoading) {
    return (
      <ScreenWrapper headerProps={{ title: 'Student Profile', onBackPress: () => router.back() }}>
        <ListLoadingSkeleton count={3} />
      </ScreenWrapper>
    );
  }

  if (!student || error) {
    return (
      <ScreenWrapper headerProps={{ title: 'Student Profile', onBackPress: () => router.back() }}>
        <ListEmptyState
          title="Student Record Not Found"
          message="No active student profile matches the provided identifier."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  const handleCallGuardian = () => {
    if (!student.guardianPhone) {
      Alert.alert('No Phone', 'No guardian phone registered for this student.');
      return;
    }
    Linking.openURL(`tel:${student.guardianPhone}`).catch(() => {
      Alert.alert('Calling Guardian', `Dialing ${student.guardianPhone}`);
    });
  };

  const handleMessageGuardianInApp = () => {
    Alert.alert(
      'In-App Parent Notice',
      `Dispatch progress and attendance update directly to ${student.guardianName}'s parent portal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch In-App Notice',
          onPress: () => {
            Alert.alert(
              'Notice Dispatched',
              `Update sent to ${student.guardianName}'s portal for ${student.name}.`
            );
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper
      scrollable={false}
      headerProps={{
        title: student.name,
        instituteName: student.batchName,
        onBackPress: () => router.back(),
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 140 }}
        contentContainerClassName="gap-3.5"
      >
        <StudentDetailHeader
          student={student}
          onCallGuardian={handleCallGuardian}
          onMessageGuardian={handleMessageGuardianInApp}
        />

        {/* Sub-Tabs Selector */}
        <View className="flex-row bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs">
          <TouchableOpacity
            onPress={() => setActiveTab('analytics')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'analytics' ? 'bg-blue-600' : ''
            }`}
          >
            <Text
              className={`text-xs font-sans-bold ${
                activeTab === 'analytics' ? 'text-white' : 'text-slate-500'
              }`}
            >
              Analytics 📊
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('attendance')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'attendance' ? 'bg-blue-600' : ''
            }`}
          >
            <Text
              className={`text-xs font-sans-bold ${
                activeTab === 'attendance' ? 'text-white' : 'text-slate-500'
              }`}
            >
              Attendance 📅
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('bio')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'bio' ? 'bg-blue-600' : ''
            }`}
          >
            <Text
              className={`text-xs font-sans-bold ${
                activeTab === 'bio' ? 'text-white' : 'text-slate-500'
              }`}
            >
              Bio & Remarks 📝
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'analytics' && (
          <View className="gap-3.5">
            <PerformanceComparisonChart data={comparisonChartData} />
            <SubjectRadarOrBarChart />
          </View>
        )}

        {activeTab === 'attendance' && <StudentAttendanceTab student={student} />}

        {activeTab === 'bio' && <StudentBioTab student={student} />}
      </ScrollView>
    </ScreenWrapper>
  );
}
