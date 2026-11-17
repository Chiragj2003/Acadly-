import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Layers,
  Copy,
  Share2,
  ChevronRight,
  Calendar,
  Clock,
  ClipboardCheck,
  Plus,
  Award,
  MessageSquare,
  Megaphone,
} from 'lucide-react-native';
import { Badge } from '@/components/ui';

interface TeacherProfile {
  fullName: string;
  qualification: string;
  experienceYears: number;
  specializationSubjects: string[];
  teacherCode: string;
}

interface TeacherHomeTabProps {
  teacherMode: 'solo' | 'coaching_faculty';
  teacherProfile: TeacherProfile;
  pendingJoinCount: number;
  onOpenDualMode: () => void;
  onCopyTeacherCode: () => void;
  onShareTeacherCode: () => void;
  onReviewPending: () => void;
  onNavigateTab: (tab: 'roster' | 'publish' | 'exams_chat' | 'profile') => void;
  onOpenCreateDpp: () => void;
  onOpenMarksEntry: () => void;
  onOpenChat: () => void;
  onOpenAnnouncement?: () => void;
}

export const TeacherHomeTab: React.FC<TeacherHomeTabProps> = ({
  teacherMode,
  teacherProfile,
  pendingJoinCount,
  onOpenDualMode,
  onCopyTeacherCode,
  onShareTeacherCode,
  onReviewPending,
  onNavigateTab,
  onOpenCreateDpp,
  onOpenMarksEntry,
  onOpenChat,
  onOpenAnnouncement,
}) => {
  return (
    <View className="gap-3.5">
      {/* 1. Shareable Teacher Code Hero Card */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <Text className="text-xs font-sans-bold text-slate-500 uppercase tracking-wider">
              {teacherMode === 'solo' ? 'Solo Tutor Workspace' : 'Institute Faculty Mode'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onOpenDualMode}
            className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex-row items-center gap-1 active:scale-95"
          >
            <Layers size={12} color="#1C1C1E" />
            <Text className="text-[11px] font-sans-bold text-blue-600">
              {teacherMode === 'solo' ? 'Solo' : 'Coaching'} • Switch
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-3.5 mb-4">
          <View className="w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center shadow-xs">
            <Text className="text-lg font-display text-white">
              {teacherProfile.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </Text>
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-base font-display text-slate-900" numberOfLines={1}>
              {teacherProfile.fullName}
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
              {teacherProfile.qualification} • {teacherProfile.experienceYears} Years Exp
            </Text>
            <Text className="text-[11px] font-sans-semibold text-blue-600 mt-0.5">
              {teacherProfile.specializationSubjects.join(' • ')}
            </Text>
          </View>
        </View>

        {/* Shareable Teacher Code Strip */}
        <View className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-sans-bold text-slate-600 uppercase tracking-wider">
              Shareable Teacher Code
            </Text>
            <Text className="text-base font-display text-blue-600 tracking-wider">
              {teacherProfile.teacherCode}
            </Text>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onCopyTeacherCode}
              className="p-2 bg-white rounded-xl border border-slate-200 active:scale-95"
            >
              <Copy size={14} color="#4A463F" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onShareTeacherCode}
              className="bg-blue-600 px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 active:scale-95 shadow-xs"
            >
              <Share2 size={13} color="#ffffff" />
              <Text className="text-xs font-sans-bold text-white">Share Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Verification Notice */}
        {pendingJoinCount > 0 && (
          <TouchableOpacity
            onPress={onReviewPending}
            className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex-row items-center justify-between active:scale-98"
          >
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <View className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <Text className="text-xs font-sans-bold text-amber-900">
                {pendingJoinCount} student{pendingJoinCount > 1 ? 's' : ''} waiting for batch admission
              </Text>
            </View>
            <View className="flex-row items-center gap-1 bg-amber-200/60 px-2 py-0.5 rounded-lg">
              <Text className="text-[10px] font-sans-bold text-amber-900">Review</Text>
              <ChevronRight size={12} color="#78350f" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Today's Classroom Schedule */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Calendar size={16} color="#1C1C1E" />
            <Text className="text-sm font-sans-bold text-slate-900">Today's Class Schedule</Text>
          </View>
          <Badge label="3 Sessions" variant="info" />
        </View>

        <View className="gap-2.5">
          {[
            { batch: 'Class 12 • JEE Advanced (Morning)', subject: 'Physics • Rotational Dynamics', time: '04:30 PM - 06:00 PM', count: '28 Students', active: true },
            { batch: 'JEE Advanced Rankers', subject: 'Physics • Electromagnetic Induction', time: '06:15 PM - 07:45 PM', count: '18 Students', active: false },
            { batch: 'Class 11 Foundation', subject: 'Mechanics • Laws of Motion', time: '08:00 PM - 09:15 PM', count: '22 Students', active: false },
          ].map((item, idx) => (
            <View
              key={idx}
              className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${
                item.active ? 'bg-blue-50/60 border-blue-200' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <View className="flex-1 pr-2">
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text className="text-xs font-sans-bold text-slate-900">{item.batch}</Text>
                  {item.active && (
                    <View className="bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
                      <Text className="text-[9px] font-sans-bold text-emerald-800">Next Up</Text>
                    </View>
                  )}
                </View>
                <Text className="text-[11px] text-slate-500">{item.subject}</Text>
                <View className="flex-row items-center gap-2 mt-1">
                  <View className="flex-row items-center gap-1">
                    <Clock size={11} color="#6E6A63" />
                    <Text className="text-[10px] font-sans text-slate-500">{item.time}</Text>
                  </View>
                  <Text className="text-[10px] text-slate-500">•</Text>
                  <Text className="text-[10px] font-sans text-slate-500">{item.count}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => onNavigateTab('roster')}
                className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 active:scale-95"
              >
                <Text className="text-xs font-sans-bold text-blue-600">Roll Call →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* 3. Quick Action Navigation Cards */}
      <View className="gap-2">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-xs font-sans-bold text-slate-600 uppercase tracking-wider">
            Quick Shortcuts
          </Text>
          {onOpenAnnouncement && (
            <TouchableOpacity
              onPress={onOpenAnnouncement}
              className="flex-row items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg active:scale-95"
            >
              <Megaphone size={11} color="#1C1C1E" />
              <Text className="text-[10px] font-sans-bold text-blue-700">Broadcast Notice</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => onNavigateTab('roster')}
            className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 active:scale-98 shadow-xs"
          >
            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
              <ClipboardCheck size={18} color="#1C1C1E" />
            </View>
            <Text className="text-xs font-sans-bold text-slate-800 text-center">Daily Roll Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenCreateDpp}
            className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 active:scale-98 shadow-xs"
          >
            <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center">
              <Plus size={18} color="#059669" />
            </View>
            <Text className="text-xs font-sans-bold text-slate-800 text-center">New DPP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenMarksEntry}
            className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 active:scale-98 shadow-xs"
          >
            <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center">
              <Award size={18} color="#d97706" />
            </View>
            <Text className="text-xs font-sans-bold text-slate-800 text-center">Test Marks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenChat}
            className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 active:scale-98 shadow-xs"
          >
            <View className="w-10 h-10 rounded-xl bg-purple-50 items-center justify-center">
              <MessageSquare size={18} color="#7c3aed" />
            </View>
            <Text className="text-xs font-sans-bold text-slate-800 text-center">Doubt Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
