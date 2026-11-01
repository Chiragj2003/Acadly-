import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Bell, ChevronDown, ArrowLeft, User } from 'lucide-react-native';

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
  instituteName = 'Apex IIT-JEE Academy',
  onInstitutePress,
  onNotificationPress,
  onProfilePress,
  onBackPress,
  hasUnreadNotifications = true,
  className = '',
}) => {
  return (
    <View
      className={`h-16 px-4 flex-row items-center justify-between bg-surface/90 border-b border-black/5 ${className}`}
    >
      <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
        {onBackPress && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBackPress}
            className="w-9 h-9 rounded-full bg-surface-container items-center justify-center active:bg-surface-container-high"
          >
            <ArrowLeft size={18} color="#0b1c30" />
          </Pressable>
        )}

        <View className="flex-col min-w-0 flex-1">
          {instituteName && (
            <Pressable
              onPress={onInstitutePress}
              className="flex-row items-center gap-1 self-start"
            >
              <Text
                className="text-xs font-semibold text-secondary"
                numberOfLines={1}
              >
                {instituteName}
              </Text>
              <ChevronDown size={14} color="#0051d5" />
            </Pressable>
          )}

          <Text
            className="text-lg font-bold text-on-surface tracking-tight"
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
          className="w-10 h-10 rounded-full items-center justify-center relative active:bg-surface-container"
        >
          <Bell size={20} color="#45464d" />
          {hasUnreadNotifications && (
            <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-white" />
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="User profile"
          onPress={onProfilePress}
          className="w-8 h-8 rounded-full bg-primary items-center justify-center shadow-sm active:scale-95"
        >
          <User size={16} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
};
