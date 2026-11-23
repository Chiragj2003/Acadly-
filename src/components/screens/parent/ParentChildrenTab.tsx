import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AttendanceRingAndTrendChart } from '@/components/charts';
import { ChildStudent } from '@/context/ChildContext';

interface ParentChildrenTabProps {
  selectedChild: ChildStudent | null;
  onOpenLinkChild: () => void;
}

export const ParentChildrenTab: React.FC<ParentChildrenTabProps> = ({
  selectedChild,
  onOpenLinkChild,
}) => {
  if (!selectedChild) {
    return (
      <View className="bg-white border border-hairline rounded-3xl p-6 items-center justify-center gap-2">
        <Text className="text-sm font-sans-bold text-slate-800">No Child Selected</Text>
        <Text className="text-xs text-slate-500">Link a child using their student code.</Text>
      </View>
    );
  }

  return (
    <View className="gap-3.5">
      <View className="bg-white border border-hairline rounded-3xl p-5 gap-3.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-sans-bold text-slate-900">Student Profile & Vitals</Text>
          <TouchableOpacity
            onPress={onOpenLinkChild}
            className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl active:scale-95"
          >
            <Text className="text-xs font-sans-bold text-blue-600">+ Link Another Child</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-slate-50 rounded-2xl p-4 border border-hairline gap-2.5">
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Full Name:</Text>
            <Text className="text-xs font-sans-bold text-slate-800">{selectedChild.full_name}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Admission No:</Text>
            <Text className="text-xs font-mono font-sans-bold text-slate-800">
              {selectedChild.admission_number || selectedChild.id.slice(0, 8)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Class & Grade:</Text>
            <Text className="text-xs font-sans-bold text-slate-800">{selectedChild.grade}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Assigned Batch:</Text>
            <Text className="text-xs font-sans-bold text-blue-600">{selectedChild.batch_name}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Parent Link Code:</Text>
            <Text className="text-xs font-mono font-sans-bold text-slate-800">{selectedChild.parent_code}</Text>
          </View>
        </View>

        {/* Attendance Breakdown Ring */}
        <AttendanceRingAndTrendChart percentage={92} />
      </View>
    </View>
  );
};
