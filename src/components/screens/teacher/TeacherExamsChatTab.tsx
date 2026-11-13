import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Award, Plus, MessageSquare, Users, Sparkles, ArrowRight } from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { type Student360Profile } from '@/types/database';

interface TeacherExamsChatTabProps {
  batchName: string;
  students: Student360Profile[];
  onOpenMarksModal: () => void;
  onOpenChat: () => void;
  onOpenCommunity: () => void;
}

export const TeacherExamsChatTab: React.FC<TeacherExamsChatTabProps> = ({
  batchName,
  students,
  onOpenMarksModal,
  onOpenChat,
  onOpenCommunity,
}) => {
  return (
    <View className="gap-3.5">
      {/* Record Test Marks Banner */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Award size={18} color="#d97706" />
            <Text className="text-sm font-bold text-slate-900">Exam Marks & Live Rankings</Text>
          </View>
          <TouchableOpacity
            onPress={onOpenMarksModal}
            className="bg-amber-500 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 active:scale-95"
          >
            <Plus size={13} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Record Marks</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xs text-slate-600 leading-relaxed">
          Publish assessment scores to instantly compute batch average, highest topper benchmark, and percentile rankings across all student dashboards.
        </Text>
      </View>

      {/* Batch Group Real-Time Chat Card */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <View className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
              <Text className="text-lg">📚</Text>
            </View>
            <View>
              <Text className="text-sm font-bold text-slate-900">{batchName} Chat</Text>
              <Text className="text-xs text-slate-500">Teacher + {students.length} Pupils</Text>
            </View>
          </View>
          <Badge label="Realtime" variant="success" />
        </View>

        <View className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
          <Text className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
            Pinned Class Announcement
          </Text>
          <Text className="text-xs text-slate-800 font-semibold">
            📌 Physics masterclass on Rotational Dynamics is live today at 04:30 PM. Keep your formula cheat-sheets ready!
          </Text>
        </View>

        <TouchableOpacity
          onPress={onOpenChat}
          className="bg-blue-600 py-3 rounded-2xl items-center flex-row justify-center gap-2 shadow-xs active:scale-98"
        >
          <MessageSquare size={14} color="#ffffff" />
          <Text className="text-xs font-bold text-white">Open Batch Chat Room →</Text>
        </TouchableOpacity>
      </View>

      {/* Direct Student Messages */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Users size={16} color="#2563EB" />
            <Text className="text-sm font-bold text-slate-900">1-on-1 Student Doubt Rooms</Text>
          </View>
          <Badge label="1 Doubt" variant="neutral" />
        </View>

        <View className="gap-2">
          {students.slice(0, 3).map((st, idx) => (
            <TouchableOpacity
              key={st.id}
              onPress={onOpenChat}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex-row items-center justify-between active:scale-98"
            >
              <View className="flex-1 pr-2">
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text className="text-xs font-bold text-slate-900">{st.name}</Text>
                  <Text className="text-[10px] text-slate-500 font-semibold">{st.rollNumber}</Text>
                  {idx === 0 && (
                    <View className="bg-rose-100 px-1.5 py-0.2 rounded border border-rose-200">
                      <Text className="text-[9px] font-bold text-rose-800">PDF Doubt</Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-slate-500" numberOfLines={1}>
                  {idx === 0
                    ? 'Sir, I uploaded my solution notes. Could you check step 2?'
                    : 'Sir, which reference book for Rotational Mechanics?'}
                </Text>
              </View>
              <Text className="text-[10px] font-semibold text-blue-600">Open Chat</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Community Doubts Wall Link */}
        <TouchableOpacity
          onPress={onOpenCommunity}
          className="mt-1 bg-slate-100 p-3 rounded-2xl border border-slate-200 flex-row items-center justify-between active:scale-98"
        >
          <View className="flex-row items-center gap-2">
            <Sparkles size={14} color="#2563EB" />
            <Text className="text-xs font-bold text-slate-800">Community Doubts & Forum</Text>
          </View>
          <ArrowRight size={14} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
