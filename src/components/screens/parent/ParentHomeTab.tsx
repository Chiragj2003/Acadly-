import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CalendarCheck, MessageSquare, Plus, Users } from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { StudentScheduleSection } from '@/components/screens/student/StudentScheduleSection';
import { StudentResultsCard } from '@/components/academic/StudentResultsCard';
import { StudentAnnouncementFeed } from '@/components/academic/StudentAnnouncementFeed';
import { ChildStudent } from '@/context/ChildContext';

interface ParentHomeTabProps {
  selectedChild: ChildStudent | null;
  onOpenLinkChild: () => void;
  onOpenChat: () => void;
}

export const ParentHomeTab: React.FC<ParentHomeTabProps> = ({
  selectedChild,
  onOpenLinkChild,
  onOpenChat,
}) => {
  if (!selectedChild) {
    return (
      <View className="bg-white border border-slate-200/90 rounded-3xl p-8 items-center justify-center gap-3 shadow-xs">
        <View className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 items-center justify-center">
          <Users size={28} color="#2563EB" />
        </View>
        <Text className="text-base font-extrabold text-slate-900 text-center">
          No children linked yet, enter a student code
        </Text>
        <Text className="text-xs text-slate-500 text-center leading-relaxed">
          Ask your tuition teacher for your ward's unique Student Link Code to view real-time attendance, test performance, and batch schedule.
        </Text>
        <TouchableOpacity
          onPress={onOpenLinkChild}
          className="bg-blue-600 px-5 py-3 rounded-2xl flex-row items-center gap-2 active:scale-95 shadow-xs mt-2"
        >
          <Plus size={16} color="#ffffff" />
          <Text className="text-xs font-bold text-white">Enter Student Link Code</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="gap-3.5">
      {/* 0. Institute & Batch Announcements */}
      <StudentAnnouncementFeed
        batchId={selectedChild.batch_id}
      />

      {/* 1. Today's Attendance Overview */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <CalendarCheck size={18} color="#059669" />
            <Text className="text-sm font-bold text-slate-900">Today's Attendance</Text>
          </View>
          <Badge label="Enrolled" variant="success" showDot />
        </View>

        <View className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
          <Text className="text-xs font-bold text-slate-800">
            {selectedChild.full_name}
          </Text>
          <Text className="text-[11px] text-slate-500 mt-0.5">
            {selectedChild.batch_name} • Adm: {selectedChild.admission_number || selectedChild.id.slice(0, 8)}
          </Text>
        </View>
      </View>

      {/* 2. Batch Schedule (Real DB Queries) */}
      <StudentScheduleSection batchId={selectedChild.batch_id} />

      {/* 3. Academic Results & Subject Mastery (Real DB Queries) */}
      <StudentResultsCard
        studentId={selectedChild.id}
        studentName={selectedChild.full_name}
      />

      {/* 4. Connect with Tuition Teacher */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <MessageSquare size={16} color="#2563EB" />
            <Text className="text-sm font-bold text-slate-900">Connect with Teacher</Text>
          </View>
          <Badge label="Active Today" variant="info" />
        </View>

        <Text className="text-xs text-slate-600 leading-relaxed">
          Direct in-app messaging channel with {selectedChild.batch_name} faculty. Inquire about test corrections, homework, and attendance.
        </Text>

        <TouchableOpacity
          onPress={onOpenChat}
          className="bg-blue-600 py-3 rounded-2xl items-center flex-row justify-center gap-2 active:scale-98 shadow-xs"
        >
          <MessageSquare size={16} color="#ffffff" />
          <Text className="text-xs font-bold text-white">Open In-App Faculty Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
