import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Users, GraduationCap, DollarSign, CalendarCheck, ArrowRight, UserCheck } from 'lucide-react-native';

interface AdminHomeTabProps {
  enrolledStudentsCount: number;
  activeBatchesCount: number;
  pendingRequestsCount: number;
  onOpenBatches: () => void;
  onOpenAdmissions: () => void;
  onOpenStudentDirectory: () => void;
}

export const AdminHomeTab: React.FC<AdminHomeTabProps> = ({
  enrolledStudentsCount,
  activeBatchesCount,
  pendingRequestsCount,
  onOpenBatches,
  onOpenAdmissions,
  onOpenStudentDirectory,
}) => {
  return (
    <View className="gap-3.5">
      {/* Metrics Row */}
      <View className="flex-row gap-2.5">
        <View className="flex-1 bg-white border border-hairline rounded-2xl p-3.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] font-sans-bold text-slate-500">Students</Text>
            <GraduationCap size={16} color="#1C1C1E" />
          </View>
          <Text className="text-xl font-display text-slate-900 mt-1">{enrolledStudentsCount}</Text>
          <Text className="text-xs text-emerald-600 font-sans-semibold mt-0.5">Active Enrollment</Text>
        </View>

        <View className="flex-1 bg-white border border-hairline rounded-2xl p-3.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] font-sans-bold text-slate-500">Batches</Text>
            <Users size={16} color="#7c3aed" />
          </View>
          <Text className="text-xl font-display text-slate-900 mt-1">{activeBatchesCount}</Text>
          <Text className="text-xs text-purple-600 font-sans-semibold mt-0.5">Ongoing Batches</Text>
        </View>
      </View>

      {/* Quick Action Cards */}
      <View className="bg-white border border-hairline rounded-3xl p-5 gap-3">
        <Text className="text-xs font-sans-bold text-slate-500">
          Quick Management Actions
        </Text>

        <TouchableOpacity
          onPress={onOpenAdmissions}
          className="flex-row items-center justify-between p-3.5 rounded-2xl bg-pastel-lilac-soft border border-pastel-lilac active:scale-98"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-pastel-lilac items-center justify-center">
              <UserCheck size={18} color="#7c3aed" />
            </View>
            <View>
              <Text className="text-xs font-sans-bold text-slate-900">Admissions & Join Requests</Text>
              <Text className="text-[11px] text-purple-700 font-sans-semibold mt-0.5">
                {pendingRequestsCount} Pending Approval
              </Text>
            </View>
          </View>
          <ArrowRight size={16} color="#7c3aed" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenStudentDirectory}
          className="flex-row items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-hairline active:scale-98"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center">
              <GraduationCap size={18} color="#1C1C1E" />
            </View>
            <View>
              <Text className="text-xs font-sans-bold text-slate-900">Student 360 Directory</Text>
              <Text className="text-[11px] text-slate-500 mt-0.5">View profiles & fee statuses</Text>
            </View>
          </View>
          <ArrowRight size={16} color="#6E6A63" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenBatches}
          className="flex-row items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-hairline active:scale-98"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
              <Users size={18} color="#4A463F" />
            </View>
            <View>
              <Text className="text-xs font-sans-bold text-slate-900">Batch Configurations</Text>
              <Text className="text-[11px] text-slate-500 mt-0.5">Manage timings & assigned tutors</Text>
            </View>
          </View>
          <ArrowRight size={16} color="#6E6A63" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
