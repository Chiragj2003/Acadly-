import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Bell, ChevronDown, ArrowLeft, User, Sparkles } from 'lucide-react-native';

export interface HeaderBarProps {
  title: string;
  instituteName?: string;
  onInstitutePress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onBackPress?: () => void;
  hasUnreadNotifications?: boolean;
  className?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  instituteName = 'Bloom Academy 🌸',
  onInstitutePress,
  onNotificationPress,
  onProfilePress,
  onBackPress,
  hasUnreadNotifications = true,
  className = '',
}) => {
  return (
    <View
      className={`h-16 px-4 flex-row items-center justify-between bg-cute-cream/95 border-b border-cute-border ${className}`}
    >
      <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
        {onBackPress && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBackPress}
            className="w-9 h-9 rounded-2xl bg-white border border-cute-border items-center justify-center active:scale-95 shadow-xs"
          >
            <ArrowLeft size={18} color="#2e2421" />
          </Pressable>
        )}

        <View className="flex-col min-w-0 flex-1">
          {instituteName && (
            <Pressable
              onPress={onInstitutePress}
              className="flex-row items-center gap-1 self-start"
            >
              <Text
                className="text-xs font-bold text-cute-peach"
                numberOfLines={1}
              >
                {instituteName}
              </Text>
              <ChevronDown size={12} color="#ff7d6b" />
            </Pressable>
          )}

          <Text
            className="text-lg font-black text-cute-cocoa tracking-tight"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2 shrink-0">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={onNotificationPress}
          className="w-10 h-10 rounded-2xl bg-white border border-cute-border items-center justify-center relative active:scale-95 shadow-xs"
        >
          <Bell size={18} color="#7d6f6a" />
          {hasUnreadNotifications && (
            <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="User profile"
          onPress={onProfilePress}
          className="w-9 h-9 rounded-2xl bg-cute-peach-light border border-cute-peach items-center justify-center shadow-xs active:scale-95"
        >
          <Text className="text-sm">🌸</Text>
        </Pressable>
      </View>
    </View>
  );
};
