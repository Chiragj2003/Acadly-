import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { NotificationCenterModal } from './NotificationCenterModal';

interface NotificationBellProps {
  className?: string;
  iconColor?: string;
  size?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  iconColor = '#475569',
  size = 18,
}) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUnread = useCallback(async () => {
    if (!isSupabaseConfigured || !user?.id) return;
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (!error && typeof count === 'number') {
        setUnreadCount(count);
      }
    } catch {
      // Non-blocking fallback
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Notifications, ${unreadCount} unread`}
        className={`relative min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 active:scale-95 ${className}`}
      >
        <Bell size={size} color={iconColor} />
        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 bg-rose-500 rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center border-2 border-white dark:border-slate-900">
            <Text className="text-[10px] font-black text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <NotificationCenterModal
        visible={isOpen}
        onClose={() => {
          setIsOpen(false);
          fetchUnread();
        }}
        onNotificationsRead={() => {
          setUnreadCount(0);
        }}
      />
    </>
  );
};
