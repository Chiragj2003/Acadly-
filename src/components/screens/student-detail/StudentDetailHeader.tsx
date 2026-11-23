import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { GraduationCap, Phone, MessageSquare } from 'lucide-react-native';
import { Student360Profile } from '@/types/database';

interface StudentDetailHeaderProps {
  student: Student360Profile;
  onCallGuardian: () => void;
  onMessageGuardian: () => void;
}

export const StudentDetailHeader: React.FC<StudentDetailHeaderProps> = ({
  student,
  onCallGuardian,
  onMessageGuardian,
}) => {
  return (
    <View className="bg-white border border-hairline rounded-3xl p-5">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
            <GraduationCap size={24} color="#1C1C1E" />
          </View>
          <View>
            <Text className="text-base font-display text-slate-900">{student.name}</Text>
            <Text className="text-xs text-slate-500">
              {student.rollNumber} • {student.grade}
            </Text>
          </View>
        </View>

        {student.rank > 0 && (
          <View className="bg-pastel-butter px-3 py-1 rounded-full">
            <Text className="text-xs font-sans-bold text-ink">
              {/* percentile carries the average test score from student_roster_stats */}
              Rank {student.rank}
              {student.percentile > 0 ? ` · avg ${student.percentile}%` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Parent Link Code Strip */}
      <View className="bg-slate-50 p-2.5 rounded-xl border border-hairline mb-3 flex-row items-center justify-between">
        <Text className="text-[11px] font-sans-bold text-slate-500">
          Parent Link Code:
        </Text>
        <Text className="text-xs font-mono font-sans-bold text-blue-600">
          {student.parentLinkCode || 'UNLINKED'}
        </Text>
      </View>

      {/* Quick Guardian Action Buttons */}
      <View className="flex-row gap-2 pt-2 border-t border-slate-100">
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onCallGuardian}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 flex-row items-center justify-center gap-1.5 active:scale-98"
        >
          <Phone size={13} color="#ffffff" />
          <Text className="text-xs font-sans-bold text-white">
            Call Guardian ({student.guardianName.split(' ')[0]})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onMessageGuardian}
          className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 flex-row items-center justify-center gap-1.5 active:scale-98"
        >
          <MessageSquare size={13} color="#1C1C1E" />
          <Text className="text-xs font-sans-bold text-blue-700">In-App Notice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
