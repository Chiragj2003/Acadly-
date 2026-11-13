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
        <View className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs">
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] font-bold text-slate-500 uppercase">Students</Text>
            <GraduationCap size={16} color="#2563eb" />
          </View>
          <Text className="text-xl font-black text-slate-900 mt-1">{enrolledStudentsCount}</Text>
          <Text className="text-[10px] text-emerald-600 font-semibold mt-0.5">Active Enrollment</Text>
        </View>

        <View className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs">
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] font-bold text-slate-500 uppercase">Batches</Text>
            <Users size={16} color="#7c3aed" />
          </View>
          <Text className="text-xl font-black text-slate-900 mt-1">{activeBatchesCount}</Text>
          <Text className="text-[10px] text-purple-600 font-semibold mt-0.5">Ongoing Batches</Text>
        </View>
      </View>

      {/* Quick Action Cards */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Quick Management Actions
        </Text>

        <TouchableOpacity
          onPress={onOpenAdmissions}
          className="flex-row items-center justify-between p-3.5 rounded-2xl bg-purple-50 border border-purple-200/80 active:scale-98"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-purple-100 items-center justify-center">
              <UserCheck size={18} color="#7c3aed" />
            </View>
            <View>
              <Text className="text-xs font-bold text-slate-900">Admissions & Join Requests</Text>
              <Text className="text-[11px] text-purple-700 font-semibold mt-0.5">
                {pendingRequestsCount} Pending Approval
              </Text>
            </View>
          </View>
          <ArrowRight size={16} color="#7c3aed" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenStudentDirectory}
          className="flex-row items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 active:scale-98"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center">
              <GraduationCap size={18} color="#2563eb" />
            </View>
            <View>
              <Text className="text-xs font-bold text-slate-900">Student 360 Directory</Text>
              <Text className="text-[11px] text-slate-500 mt-0.5">View profiles & fee statuses</Text>
            </View>
          </View>
          <ArrowRight size={16} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenBatches}
          className="flex-row items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 active:scale-98"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
              <Users size={18} color="#475569" />
            </View>
            <View>
              <Text className="text-xs font-bold text-slate-900">Batch Configurations</Text>
              <Text className="text-[11px] text-slate-500 mt-0.5">Manage timings & assigned tutors</Text>
            </View>
          </View>
          <ArrowRight size={16} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
