import React from 'react';
import { View, Text, Pressable, Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, MessageCircle } from 'lucide-react-native';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useStudentProfile } from '@/hooks/queries/useStudentQueries';
import { useAttendanceTrend, useSubjectMastery } from '@/hooks/queries/useAnalyticsQueries';
import { ScreenWrapper, ListLoadingSkeleton, ListEmptyState, Mascot, ListRow, SectionTitle } from '@/components/ui';

const DOT: Record<string, string> = { P: 'bg-go', L: 'bg-[#F2C14E]', A: 'bg-ink', E: 'bg-pastel-sky' };

/**
 * Student detail (teacher / admin / parent): attendance at a glance, the last
 * 20 class days as dots, recent results and a call button. Real data only —
 * the old screen showed sample charts and a "notice dispatched" message that
 * never sent anything.
 */
export default function StudentDetailScreen() {
  const { isAuthorized, isLoading: isGuardLoading } = useRoleGuard(['teacher', 'admin', 'parent']);
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const { data: student, isLoading: isStudentLoading, error } = useStudentProfile(params.studentId);
  const { data: trend } = useAttendanceTrend(student?.id);
  const { data: report } = useSubjectMastery(student?.id);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const topBar = (
    <View className="flex-row items-center justify-between h-12">
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} className="w-12 h-12 rounded-full bg-white items-center justify-center">
        <ChevronLeft size={22} color="#1C1C1E" />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Message parent"
        onPress={() => router.push('/chat')}
        className="w-12 h-12 rounded-full bg-white items-center justify-center"
      >
        <MessageCircle size={20} color="#1C1C1E" fill="#1C1C1E" />
      </Pressable>
    </View>
  );

  if (isGuardLoading || !isAuthorized || isStudentLoading) {
    return (
      <ScreenWrapper contentContainerClassName="gap-5 px-5 pt-3">
        {topBar}
        <ListLoadingSkeleton count={3} height={110} />
      </ScreenWrapper>
    );
  }

  if (!student || error) {
    return (
      <ScreenWrapper contentContainerClassName="gap-5 px-5 pt-3">
        {topBar}
        <ListEmptyState title="Student not found" message="This student may have left the batch." actionLabel="Go back" onAction={back} />
      </ScreenWrapper>
    );
  }

  const initials = student.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  const hasAttendance = (trend?.totalClasses ?? 0) > 0;
  const rate = Math.round(trend?.attendanceRate ?? 0);
  const recentDays = [...(trend?.recentRecords ?? [])].reverse();
  const missed = (trend?.recentRecords ?? []).slice(0, 10).filter((r) => r.status === 'A').length;
  const results = report?.recentResults ?? [];

  const callParent = () => {
    if (!student.guardianPhone) {
      Alert.alert('No phone number', 'The institute hasn’t added a parent phone number for this student.');
      return;
    }
    Linking.openURL(`tel:${student.guardianPhone}`).catch(() => Alert.alert('Can’t call', 'Calling isn’t available on this device.'));
  };

  const details = [
    ['Parent', [student.guardianName !== 'Guardian' ? student.guardianName : '', student.guardianPhone].filter(Boolean).join(' · ')],
    ['School', student.school !== 'School' ? student.school : ''],
    ['Target exam', student.targetExam],
    ['Parent code', student.parentLinkCode],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <ScreenWrapper contentContainerClassName="gap-5 px-5 pt-3">
      {topBar}

      <View className="items-center gap-1.5">
        <View className="w-[84px] h-[84px] rounded-full bg-pastel-lilac border-[3px] border-white items-center justify-center">
          <Text className="font-display text-ink text-[28px]">{initials}</Text>
        </View>
        <Text accessibilityRole="header" className="font-display text-ink text-[28px] text-center">
          {student.name}
        </Text>
        <Text className="font-sans text-muted text-sm">
          {[student.rollNumber && student.rollNumber !== '#00' ? `Roll ${student.rollNumber}` : null, student.grade].filter(Boolean).join(' · ')}
        </Text>
      </View>

      {hasAttendance ? (
        <View className={`rounded-3xl border-[1.5px] border-ink px-4 py-4 flex-row items-center gap-3.5 ${rate < 80 ? 'bg-pastel-peach' : 'bg-pastel-mint'}`}>
          <Text className="font-serif text-ink" style={{ fontSize: 52, lineHeight: 56 }}>
            {rate}
            <Text style={{ fontSize: 22 }}>%</Text>
          </Text>
          <View className="flex-1 gap-0.5">
            <Text className="font-sans-bold text-ink text-[15px]">{rate < 80 ? 'Attendance is slipping' : 'Attendance looks good'}</Text>
            <Text className="font-sans text-slate-700 text-[13px] leading-[18px]">
              {missed > 0 ? `Missed ${missed} of the last ${Math.min(10, trend!.recentRecords.length)} classes.` : 'No recent absences.'}
              {rate < 80 && student.guardianPhone ? ' A call home might help.' : ''}
            </Text>
          </View>
        </View>
      ) : (
        <View className="bg-white rounded-3xl p-5 items-center gap-2">
          <Mascot mood="sleepy" size="md" />
          <Text className="font-sans text-muted text-sm text-center">No attendance recorded yet.</Text>
        </View>
      )}

      {recentDays.length > 0 && (
        <View className="bg-white rounded-3xl p-4 gap-3">
          <Text className="font-sans-bold text-ink text-sm">Last {recentDays.length} class days</Text>
          <View
            accessibilityLabel={`${trend?.presentCount ?? 0} present, ${trend?.absentCount ?? 0} absent, ${trend?.lateCount ?? 0} late`}
            className="flex-row flex-wrap gap-1.5"
          >
            {recentDays.map((d) => (
              <View key={d.date} className={`w-[22px] h-[22px] rounded-full ${DOT[d.status] ?? 'bg-hairline'}`} />
            ))}
          </View>
          <View className="flex-row gap-3.5 flex-wrap">
            {[
              ['bg-go', 'Present'],
              ['bg-ink', 'Absent'],
              ['bg-[#F2C14E]', 'Late'],
            ].map(([c, l]) => (
              <View key={l} className="flex-row items-center gap-1.5">
                <View className={`w-2.5 h-2.5 rounded-full ${c}`} />
                <Text className="font-sans text-slate-600 text-xs">{l}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {results.length > 0 && (
        <View className="gap-3">
          <SectionTitle>Recent results</SectionTitle>
          <View className="bg-white rounded-3xl px-4 py-1">
            {results.slice(0, 5).map((r, i, arr) => (
              <ListRow
                key={r.resultId}
                title={r.title}
                subtitle={[r.subject, new Date(r.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')}
                trailing={
                  <Text className="font-serif text-ink text-xl">
                    {r.marksObtained}/{r.maxMarks}
                  </Text>
                }
                last={i === arr.length - 1}
              />
            ))}
          </View>
        </View>
      )}

      {details.length > 0 && (
        <View className="bg-white rounded-3xl px-4 py-1">
          {details.map(([label, value], i) => (
            <ListRow key={label} title={value} subtitle={label} last={i === details.length - 1} />
          ))}
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={callParent}
        className="min-h-[56px] rounded-full bg-ink items-center justify-center active:opacity-90"
      >
        <Text className="font-sans-bold text-white text-[17px]">Call parent</Text>
      </Pressable>
    </ScreenWrapper>
  );
}
