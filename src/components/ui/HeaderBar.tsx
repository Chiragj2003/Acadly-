import React from 'react';
import { View, Text, Pressable } from 'react-native';
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
  instituteName = 'Academy Hub',
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
      style={{ height: 64 }}
      className={`px-4 flex-row items-center justify-between bg-paper ${className}`}
    >
      {/* Left & Title Zone */}
      <View className="flex-row items-center gap-2.5 flex-1 min-w-0 mr-2">
        {onBackPress && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onBackPress}
            className="w-11 h-11 rounded-full bg-white items-center justify-center active:opacity-80"
          >
            <ArrowLeft size={17} color="#3B372F" />
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
                className="text-xs font-sans-semibold text-muted"
                numberOfLines={1}
              >
                {instituteName}
              </Text>
              {onInstitutePress && <ChevronDown size={12} color="#6E6A63" />}
            </Pressable>
          )}

          <Text
            className="text-[22px] leading-[26px] font-display text-ink"
            numberOfLines={1}
          >
            {title}
          </Text>

          {instituteSubtitle && (
            <Text className="text-xs font-sans text-slate-500" numberOfLines={1}>
              {instituteSubtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Right Action Icons Zone */}
      {/* Kept to two or three round buttons so the title has room on a phone.
          Language and sign out live in each role's Profile / Account screen. */}
      <View className="flex-row items-center gap-2 shrink-0">
        {rightAction}

        {onNotificationPress && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={onNotificationPress}
            className="w-11 h-11 rounded-full bg-white items-center justify-center relative active:opacity-80"
          >
            <Bell size={18} color="#1C1C1E" />
            {hasUnreadNotifications && (
              <View className="absolute top-2.5 right-3 w-2.5 h-2.5 rounded-full bg-rose-600 border-2 border-white" />
            )}
          </Pressable>
        )}

        {onProfilePress && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="User profile"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={onProfilePress}
            className={`w-11 h-11 rounded-full border-2 border-white items-center justify-center active:opacity-80 ${
 variant === 'student'? 'bg-pastel-pink' : variant === 'calm' ? 'bg-pastel-sky' : 'bg-pastel-peach'
 }`}
          >
            {profileInitials ? (
              <Text className="text-sm font-display text-ink">
                {profileInitials.toUpperCase().slice(0, 2)}
              </Text>
            ) : (
              <User size={18} color="#1C1C1E" />
            )}
          </Pressable>
        )}

        {onLogoutPress && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={onLogoutPress}
            className="w-11 h-11 rounded-full bg-white items-center justify-center active:opacity-80"
          >
            <LogOut size={16} color="#B42318" />
          </Pressable>
        )}
      </View>
    </View>
  );
};
