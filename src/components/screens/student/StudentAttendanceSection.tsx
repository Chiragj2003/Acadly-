import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CalendarCheck, Flame, CheckCircle2, XCircle, Clock } from 'lucide-react-native';
import { useAttendanceTrend } from '@/hooks/queries/useAnalyticsQueries';

interface StudentAttendanceSectionProps {
  studentId?: string;
  batchId?: string;
}

export const StudentAttendanceSection: React.FC<StudentAttendanceSectionProps> = ({
  studentId,
  batchId,
}) => {
  const { data: trend, isLoading, error } = useAttendanceTrend(studentId, batchId);

  if (isLoading) {
    return (
      <View className="bg-white border border-hairline rounded-3xl p-5 items-center">
        <ActivityIndicator size="small" color="#1C1C1E" />
        <Text className="text-xs text-slate-400 mt-2">Computing attendance records...</Text>
      </View>
    );
  }

  if (error || !trend) {
    return null;
  }

  return (
    <View className="bg-white border border-hairline rounded-3xl p-5 gap-3.5">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <CalendarCheck size={18} color="#1C1C1E" />
          <Text className="text-sm font-sans-bold text-slate-900">Attendance & Class Streak</Text>
        </View>

        {trend.streak > 0 && (
          <View className="bg-pastel-butter px-2.5 py-1 rounded-full flex-row items-center gap-1 border border-pastel-butter">
            <Flame size={12} color="#d97706" />
            <Text className="text-xs font-display text-amber-800">{trend.streak} Day Streak</Text>
          </View>
        )}
      </View>

      {/* Aggregate KPI */}
      <View className="flex-row items-center justify-between bg-slate-50 p-4 rounded-2xl border border-hairline">
        <View>
          <Text className="text-xs font-sans-bold text-slate-500">Overall Rate</Text>
          <Text className="text-2xl font-display text-blue-700 mt-0.5">
            {trend.attendanceRate}%
          </Text>
        </View>
        <View className="flex-row gap-3">
          <View className="items-center">
            <Text className="text-xs font-sans-bold text-emerald-600">Present</Text>
            <Text className="text-sm font-display text-slate-800">{trend.presentCount}</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs font-sans-bold text-rose-600">Absent</Text>
            <Text className="text-sm font-display text-slate-800">{trend.absentCount}</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs font-sans-bold text-amber-600">Late</Text>
            <Text className="text-sm font-display text-slate-800">{trend.lateCount}</Text>
          </View>
        </View>
      </View>

      {/* Recent History Grid */}
      {trend.recentRecords.length > 0 && (
        <View className="gap-2 pt-1">
          <Text className="text-xs font-sans-bold text-slate-600">
            Recent Class Records
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {trend.recentRecords.map((r, i) => {
              const isP = r.status === 'P';
              const isA = r.status === 'A';
              const isL = r.status === 'L';
              const badgeClass = isP
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : isA
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-amber-50 border-amber-200 text-amber-700';

              return (
                <View
                  key={i}
                  className={`px-2.5 py-1.5 rounded-xl border flex-row items-center gap-1 ${badgeClass}`}
                >
                  {isP ? (
                    <CheckCircle2 size={12} color="#059669" />
                  ) : isA ? (
                    <XCircle size={12} color="#e11d48" />
                  ) : (
                    <Clock size={12} color="#d97706" />
                  )}
                  <Text className="text-[11px] font-sans-bold">
                    {r.date.substring(5)}: {r.status}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};
