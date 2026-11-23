import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, MessageSquare, Plus } from 'lucide-react-native';
import { NotificationBell } from '@/components/ui';

interface StudentHeaderProps {
  name: string;
  batchName: string;
  onOpenChat: () => void;
  onOpenCommunity: () => void;
  onJoinInstitute: () => void;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  name,
  batchName,
  onOpenChat,
  onOpenCommunity,
  onJoinInstitute,
}) => {
  return (
    <View className="flex-row items-center justify-between pb-3 border-b border-slate-200">
      <View className="flex-1 pr-2">
        <View className="flex-row items-center gap-1.5">
          <Sparkles size={16} color="#1C1C1E" />
          <Text className="text-sm font-display text-slate-900" numberOfLines={1}>
            Hi, {name}
          </Text>
        </View>
        <Text className="text-xs text-slate-500 font-sans-semibold mt-0.5" numberOfLines={1}>
          {batchName}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={onJoinInstitute}
          accessibilityRole="button"
          accessibilityLabel="Join Batch"
          className="flex-row items-center gap-1 bg-blue-50 px-2.5 py-1.5 min-h-[44px] rounded-xl border border-blue-200 active:scale-95"
        >
          <Plus size={13} color="#1C1C1E" />
          <Text className="text-[11px] font-sans-bold text-blue-700">Join Batch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenChat}
          accessibilityRole="button"
          accessibilityLabel="Classroom Chat"
          className="bg-slate-100 p-2 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 active:scale-95"
        >
          <MessageSquare size={16} color="#4A463F" />
        </TouchableOpacity>

        <NotificationBell size={16} />
      </View>
    </View>
  );
};
