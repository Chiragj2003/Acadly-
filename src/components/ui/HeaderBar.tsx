import React from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { Bell, ChevronDown, ArrowLeft, User, LogOut } from 'lucide-react-native';

export interface HeaderBarProps {
  title: string;
  instituteName?: string;
  instituteSubtitle?: string;
  profileInitials?: string;
  onInstitutePress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onLogoutPress?: () => void;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  hasUnreadNotifications?: boolean;
  variant?: 'student' | 'calm' | 'default';
  className?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  instituteName = 'Bloom Science Academy',
  instituteSubtitle,
  profileInitials,
  onInstitutePress,
  onNotificationPress,
  onProfilePress,
  onLogoutPress,
  onBackPress,
  rightAction,
  hasUnreadNotifications = false,
  variant = 'default',
  className = '',
}) => {
  return (
    <View
      style={{ height: 56 }}
      className={`px-4 flex-row items-center justify-between border-b border-slate-100 bg-white ${className}`}
    >
      {/* Left & Title Zone */}
      <View className="flex-row items-center gap-2.5 flex-1 min-w-0 mr-2">
        {onBackPress && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onBackPress}
            className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 items-center justify-center active:scale-95 shadow-2xs"
          >
            <ArrowLeft size={17} color="#334155" />
          </Pressable>
        )}

        <View className="flex-col min-w-0 flex-1 justify-center">
          {instituteName && (
            <Pressable
              onPress={onInstitutePress}
              disabled={!onInstitutePress}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              className="flex-row items-center gap-1 self-start"
            >
              <Text
                className="text-[11px] font-bold tracking-tight text-blue-600"
                numberOfLines={1}
              >
                {instituteName}
              </Text>
              {onInstitutePress && <ChevronDown size={11} color="#2563EB" />}
            </Pressable>
          )}

          <Text
            className="text-base font-black tracking-tight text-slate-900"
            numberOfLines={1}
          >
            {title}
          </Text>

          {instituteSubtitle && (
            <Text className="text-[10px] font-medium text-slate-500" numberOfLines={1}>
              {instituteSubtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Right Action Icons Zone */}
      <View className="flex-row items-center gap-2 shrink-0">
        {rightAction}

        {onNotificationPress && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={onNotificationPress}
            className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 items-center justify-center relative active:scale-95 shadow-2xs"
          >
            <Bell size={16} color="#475569" />
            {hasUnreadNotifications && (
              <View className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-white" />
            )}
          </Pressable>
        )}

        {onProfilePress && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="User profile"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={onProfilePress}
            className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 items-center justify-center active:scale-95 shadow-2xs"
          >
            {profileInitials ? (
              <Text className="text-[11px] font-black text-white">
                {profileInitials.toUpperCase().slice(0, 2)}
              </Text>
            ) : (
              <User size={16} color="#FFFFFF" />
            )}
          </Pressable>
        )}

        {onLogoutPress && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={onLogoutPress}
            className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200/80 items-center justify-center active:scale-95 shadow-2xs"
          >
            <LogOut size={14} color="#E11D48" />
          </Pressable>
        )}
      </View>
    </View>
  );
};
