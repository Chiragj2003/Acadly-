import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Award, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react-native';
import { useSubjectMastery } from '@/hooks/queries/useAnalyticsQueries';

interface StudentResultsCardProps {
  studentId: string;
  studentName?: string;
}

export const StudentResultsCard: React.FC<StudentResultsCardProps> = ({
  studentId,
  studentName,
}) => {
  const { data: report, isLoading, error, refetch } = useSubjectMastery(studentId);

  if (isLoading) {
    return (
      <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <Text className="text-xs text-slate-400">Loading academic results & mastery...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-rose-50 border border-rose-200 rounded-3xl p-5">
        <Text className="text-xs font-bold text-rose-800">Failed to load examination results</Text>
        <Text className="text-[11px] text-rose-600 mt-1">{(error as Error).message}</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-3 bg-rose-600 py-2 px-3 rounded-xl self-start"
        >
          <Text className="text-xs font-bold text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!report || report.recentResults.length === 0) {
    return (
      <View className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs items-center justify-center">
        <Award size={36} color="#94a3b8" />
        <Text className="text-sm font-bold text-slate-800 mt-2">No Examination Records Yet</Text>
        <Text className="text-xs text-slate-400 text-center mt-1">
          {studentName || 'Student'} has not participated in any published tests or exams yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3.5">
      {/* Overview Card */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Award size={18} color="#2563eb" />
            <Text className="text-sm font-bold text-slate-900">Academic Mastery & Results</Text>
          </View>
          <View className="bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200">
            <Text className="text-[11px] font-bold text-blue-800">
              Rank #{report.rankInBatch || 1}
            </Text>
          </View>
        </View>

        {/* Aggregate Stats */}
        <View className="flex-row items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          <View>
            <Text className="text-xs font-bold text-slate-700">Cumulative Average</Text>
            <Text className="text-xl font-black text-blue-700 mt-0.5">
              {report.overallPercentage}%
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xs font-bold text-slate-700">Tests Recorded</Text>
            <Text className="text-base font-black text-slate-900 mt-0.5">
              {report.totalExamsTaken} Exams
            </Text>
          </View>
        </View>

        {/* Subject Mastery Progress Bars */}
        {report.subjectMastery.length > 0 && (
          <View className="gap-2.5 pt-1">
            <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Subject Breakdown
            </Text>
            {report.subjectMastery.map((sub) => {
              const badgeVariant =
                sub.masteryLevel === 'Mastered'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : sub.masteryLevel === 'Proficient'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : sub.masteryLevel === 'Developing'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-rose-100 text-rose-800 border-rose-200';

              return (
                <View key={sub.subject} className="gap-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-slate-800">{sub.subject}</Text>
                    <View className="flex-row items-center gap-1.5">
                      <View className={`px-2 py-0.5 rounded-full border ${badgeVariant}`}>
                        <Text className="text-[10px] font-bold">{sub.masteryLevel}</Text>
                      </View>
                      <Text className="text-xs font-black text-slate-900">
                        {sub.averagePercentage}%
                      </Text>
                    </View>
                  </View>
                  {/* Progress Bar */}
                  <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(5, sub.averagePercentage))}%`,
                        backgroundColor: sub.colorHex || '#2563eb',
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Recent Examinations List */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
        <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Recent Exam Performances
        </Text>

        <View className="gap-2.5">
          {report.recentResults.map((exam) => {
            const isPassing = exam.percentage >= 40;
            return (
              <View
                key={exam.resultId}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 gap-2"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-2">
                    <Text className="text-xs font-bold text-slate-900">{exam.title}</Text>
                    <Text className="text-[11px] text-slate-500">
                      {exam.subject} • {exam.examDate}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-black text-slate-900">
                      {exam.marksObtained}/{exam.maxMarks}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded-full mt-0.5 ${
                        isPassing ? 'bg-emerald-100' : 'bg-rose-100'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          isPassing ? 'text-emerald-800' : 'text-rose-800'
                        }`}
                      >
                        {exam.grade || (isPassing ? 'PASS' : 'FAIL')} ({exam.percentage}%)
                      </Text>
                    </View>
                  </View>
                </View>

                {exam.remarks && (
                  <Text className="text-[11px] text-slate-600 italic bg-white p-2 rounded-xl border border-slate-100">
                    "{exam.remarks}"
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};
