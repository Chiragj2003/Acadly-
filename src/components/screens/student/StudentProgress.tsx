import React from 'react';
import { View, Text } from 'react-native';
import { useAttendanceTrend, useSubjectMastery } from '@/hooks/queries/useAnalyticsQueries';
import { BigNumber, InsightCard, ListEmptyState, ListLoadingSkeleton, SectionTitle, StatTile } from '@/components/ui';

interface StudentProgressProps {
  studentId?: string;
  batchId?: string;
  onPractice: () => void;
}

const BAR_TONES = ['bg-[#3D6FBF]', 'bg-go', 'bg-[#D9622B]', 'bg-[#5B3AA8]', 'bg-ink'];
const TRACK_TONES = ['bg-pastel-sky', 'bg-pastel-mint', 'bg-pastel-peach', 'bg-pastel-lilac', 'bg-hairline'];

/**
 * Soft Desk "Progress": one big serif number (average score, or attendance when
 * no tests are graded yet), three stat tiles, one sentence of advice, then
 * mastery per subject. Real data only.
 */
export const StudentProgress: React.FC<StudentProgressProps> = ({ studentId, batchId, onPractice }) => {
  const { data: trend, isLoading: trendLoading } = useAttendanceTrend(studentId, batchId);
  const { data: report, isLoading: reportLoading } = useSubjectMastery(studentId);

  if (trendLoading || reportLoading) return <ListLoadingSkeleton count={3} height={110} />;

  const hasTests = (report?.totalExamsTaken ?? 0) > 0;
  const hasAttendance = (trend?.totalClasses ?? 0) > 0;
  if (!hasTests && !hasAttendance) {
    return (
      <ListEmptyState
        title="Your progress starts here"
        message="Once your teacher takes roll call and grades a test, your scores and streak appear here."
      />
    );
  }

  const subjects = [...(report?.subjectMastery ?? [])].sort((a, b) => b.averagePercentage - a.averagePercentage);
  const weakest = subjects.length > 1 ? subjects[subjects.length - 1] : undefined;
  const recent = report?.recentResults ?? [];
  // Change between the two most recent graded tests (newest first).
  const delta = recent.length >= 2 ? Math.round(recent[0].percentage) - Math.round(recent[1].percentage) : 0;

  return (
    <View className="gap-5">
      <BigNumber
        label={hasTests ? 'Average score' : 'Attendance'}
        value={String(Math.round(hasTests ? report!.overallPercentage : trend!.attendanceRate))}
        unit="%"
        delta={hasTests && delta !== 0 ? `${delta > 0 ? '+' : ''}${delta}` : undefined}
        deltaPositive={delta > 0}
      />

      <View className="flex-row gap-2.5">
        <StatTile value={hasAttendance ? String(Math.round(trend!.attendanceRate)) : '—'} unit={hasAttendance ? '%' : undefined} label="Attendance" />
        <StatTile value={String(report?.totalExamsTaken ?? 0)} label="Tests" />
        <StatTile value={String(trend?.streak ?? 0)} unit=" days" label="Streak" />
      </View>

      {weakest && weakest.averagePercentage < 70 ? (
        <InsightCard
          eyebrow="Focus this week"
          message={`${weakest.subject} is at ${Math.round(weakest.averagePercentage)}%. A little practice each day will lift it.`}
          tone="sky"
          onPress={onPractice}
          actionLabel={`Practise ${weakest.subject}`}
        />
      ) : null}

      {subjects.length > 0 && (
        <View className="gap-3">
          <SectionTitle>By subject</SectionTitle>
          <View className="bg-white rounded-3xl p-4 gap-4">
            {subjects.map((s, i) => (
              <View key={s.subject} className="gap-1.5" accessibilityLabel={`${s.subject}: ${Math.round(s.averagePercentage)} percent, ${s.masteryLevel}`}>
                <View className="flex-row justify-between">
                  <Text className="font-sans-bold text-ink text-[15px]">{s.subject}</Text>
                  <Text className="font-sans-bold text-slate-600 text-sm">
                    {s.masteryLevel} · {Math.round(s.averagePercentage)}%
                  </Text>
                </View>
                <View className={`h-3 rounded-full overflow-hidden ${TRACK_TONES[i % TRACK_TONES.length]}`}>
                  <View
                    className={`h-3 rounded-full ${BAR_TONES[i % BAR_TONES.length]}`}
                    style={{ width: `${Math.max(4, Math.min(100, s.averagePercentage))}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
