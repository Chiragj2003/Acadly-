import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Building2, UserCheck, MessageSquare } from 'lucide-react-native';
import { NotificationBell } from '@/components/ui';

interface AdminHeaderProps {
  instituteName: string;
  instituteCode: string;
  pendingJoinCount: number;
  onOpenVerify: () => void;
  onOpenCommunity: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  instituteName,
  instituteCode,
  pendingJoinCount,
  onOpenVerify,
  onOpenCommunity,
}) => {
  return (
    <View className="flex-row items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
      <View className="flex-1 pr-2">
        <View className="flex-row items-center gap-1.5">
          <Building2 size={16} color="#7c3aed" />
          <Text className="text-sm font-display text-slate-900 dark:text-slate-100" numberOfLines={1}>
            {instituteName}
          </Text>
        </View>
        <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-sans-semibold mt-0.5">
          Center Code: {instituteCode}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={onOpenVerify}
          accessibilityRole="button"
          accessibilityLabel={`Verify Students, ${pendingJoinCount} pending`}
          className="relative bg-purple-50 dark:bg-purple-950/40 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-purple-200 dark:border-purple-800 active:scale-95"
        >
          <UserCheck size={18} color="#7c3aed" />
          {pendingJoinCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-rose-500 rounded-full w-4 h-4 items-center justify-center">
              <Text className="text-[9px] font-sans-bold text-white">{pendingJoinCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenCommunity}
          accessibilityRole="button"
          accessibilityLabel="Community Forum"
          className="bg-slate-100 dark:bg-slate-800 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95"
        >
          <MessageSquare size={18} color="#4A463F" />
        </TouchableOpacity>

        <NotificationBell size={18} />
      </View>
    </View>
  );
};
