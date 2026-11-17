import React from 'react';
import { View, Text } from 'react-native';
import { AttendanceRingAndTrendChart } from '@/components/charts';
import { Student360Profile } from '@/types/database';

interface StudentAttendanceTabProps {
  student: Student360Profile;
}

export const StudentAttendanceTab: React.FC<StudentAttendanceTabProps> = ({ student }) => {
  return (
    <View className="gap-3.5">
      <AttendanceRingAndTrendChart percentage={student.overallAttendance || 0} />

      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
        <Text className="text-sm font-sans-bold text-slate-900 mb-3">Roll Call Status</Text>
        <View className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <Text className="text-xs text-slate-700 font-sans">
            Overall Attendance Rate: <Text className="font-display text-blue-600">{student.overallAttendance}%</Text>
          </Text>
          <Text className="text-[11px] text-slate-500 mt-1">
            Real-time attendance is tracked per batch roll call session.
          </Text>
        </View>
      </View>
    </View>
  );
};
