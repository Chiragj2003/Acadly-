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
    <View className="flex-row items-center justify-between pb-3 border-b border-slate-200">
      <View className="flex-1 pr-2">
        <View className="flex-row items-center gap-1.5">
          <Building2 size={16} color="#7c3aed" />
          <Text className="text-sm font-display text-slate-900" numberOfLines={1}>
            {instituteName}
          </Text>
        </View>
        <Text className="text-xs text-slate-500 font-sans-semibold mt-0.5">
          Center Code: {instituteCode}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={onOpenVerify}
          accessibilityRole="button"
          accessibilityLabel={`Verify Students, ${pendingJoinCount} pending`}
          className="relative bg-pastel-lilac-soft min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-pastel-lilac active:scale-95"
        >
          <UserCheck size={18} color="#7c3aed" />
          {pendingJoinCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-rose-500 rounded-full w-4 h-4 items-center justify-center">
              <Text className="text-xs font-sans-bold text-white">{pendingJoinCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenCommunity}
          accessibilityRole="button"
          accessibilityLabel="Community Forum"
          className="bg-slate-100 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 active:scale-95"
        >
          <MessageSquare size={18} color="#4A463F" />
        </TouchableOpacity>

        <NotificationBell size={18} />
      </View>
    </View>
  );
};
