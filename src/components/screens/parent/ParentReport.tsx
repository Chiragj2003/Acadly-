import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Download } from 'lucide-react-native';
import { useAttendanceTrend, useSubjectMastery } from '@/hooks/queries/useAnalyticsQueries';
import { DisplayTitle, ListEmptyState, ListLoadingSkeleton, Mascot } from '@/components/ui';
import { type ChildStudent } from '@/context/ChildContext';

interface ParentReportProps {
  child: ChildStudent | null;
  onLinkChild: () => void;
  onDownload: () => void;
}

const SUBJECT_TONES = ['bg-pastel-sky', 'bg-pastel-mint', 'bg-pastel-pink', 'bg-pastel-lilac', 'bg-pastel-peach', 'bg-pastel-butter'];

/** Soft Desk parent report: recent test bars, subject tiles and the latest teacher remark. */
export const ParentReport: React.FC<ParentReportProps> = ({ child, onLinkChild, onDownload }) => {
  const { data: report, isLoading } = useSubjectMastery(child?.id);
  const { data: trend } = useAttendanceTrend(child?.id, child?.batch_id);

  if (!child) {
    return (
      <View className="bg-white rounded-3xl p-8 items-center gap-3">
        <Mascot mood="curious" size="lg" />
        <DisplayTitle center>Link your child to see reports</DisplayTitle>
        <Pressable accessibilityRole="button" onPress={onLinkChild} className="mt-2 px-6 min-h-[52px] rounded-full bg-ink justify-center">
          <Text className="font-sans-bold text-white text-base">Enter student code</Text>
        </Pressable>
      </View>
    );
  }

  const firstName = child.full_name.split(' ')[0];
  const results = [...(report?.recentResults ?? [])].slice(0, 6).reverse(); // oldest → newest
  const remark = report?.recentResults.find((r) => r.remarks)?.remarks;

  return (
    <View className="gap-5">
      <View className="flex-row items-center justify-between">
        <DisplayTitle>{firstName}&apos;s report</DisplayTitle>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Download PDF report"
          onPress={onDownload}
          className="w-12 h-12 rounded-full bg-ink items-center justify-center"
        >
          <Download size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {isLoading ? (
        <ListLoadingSkeleton count={3} height={110} />
      ) : (report?.totalExamsTaken ?? 0) === 0 ? (
        <ListEmptyState
          title="No graded tests yet"
          message={`${firstName}'s scores appear here as soon as a teacher publishes results.`}
        />
      ) : (
        <>
          <View className="bg-white rounded-[26px] p-4 gap-3">
            <View className="flex-row justify-between items-baseline">
              <Text className="font-sans-bold text-ink text-[15px]">Recent tests</Text>
              <Text className="font-sans text-muted text-xs">dashed line = class average</Text>
            </View>
            <View
              accessibilityLabel={`Recent test scores: ${results.map((r) => `${Math.round(r.percentage)}%`).join(', ')}`}
              className="h-[150px] flex-row items-end gap-3"
            >
              {results.map((r, i) => {
                const last = i === results.length - 1;
                return (
                  <View key={r.resultId} className="flex-1 items-center gap-1.5">
                    <Text className="font-serif text-ink text-[15px]">{Math.round(r.percentage)}</Text>
                    <View className="w-full justify-end" style={{ height: 110 }}>
                      {r.batchAverage ? (
                        <View
                          className="absolute left-0 right-0 border-t-[1.5px] border-dashed border-slate-500"
                          style={{ bottom: `${Math.min(100, r.batchAverage)}%` }}
                        />
                      ) : null}
                      <View
                        className={`w-full rounded-2xl ${last ? 'bg-pastel-peach border-[1.5px] border-ink' : 'bg-hairline'}`}
                        style={{ height: `${Math.max(6, Math.min(100, r.percentage))}%` }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            <View className="flex-row gap-3">
              {results.map((r) => (
                <Text key={r.resultId} className="flex-1 text-center font-sans-semibold text-muted text-[11px]" numberOfLines={1}>
                  {new Date(r.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              ))}
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2.5">
            {(report?.subjectMastery ?? []).map((s, i) => (
              <View key={s.subject} className={`basis-[30%] grow rounded-[22px] p-3.5 gap-0.5 ${SUBJECT_TONES[i % SUBJECT_TONES.length]}`}>
                <Text className="font-sans-bold text-ink text-[13px]" numberOfLines={1}>
                  {s.subject}
                </Text>
                <Text className="font-serif text-ink text-[30px]">{Math.round(s.averagePercentage)}%</Text>
                <Text className="font-sans text-slate-700 text-xs">{s.totalExams} tests</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {(trend?.totalClasses ?? 0) > 0 && (
        <View className="bg-white rounded-[26px] px-4 py-3.5 flex-row items-center justify-between">
          <Text className="font-sans-bold text-ink text-[15px]">Attendance</Text>
          <Text className="font-serif text-ink text-2xl">{Math.round(trend!.attendanceRate)}%</Text>
        </View>
      )}

      {remark ? (
        <View className="bg-white rounded-[26px] p-4 gap-2">
          <Text className="font-serif-medium text-ink text-[19px] leading-[26px]">&ldquo;{remark}&rdquo;</Text>
          <Text className="font-sans-bold text-muted text-[13px]">Teacher&apos;s note</Text>
        </View>
      ) : null}
    </View>
  );
};
