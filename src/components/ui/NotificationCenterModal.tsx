import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Bell, X, CheckCheck, Clock, AlertCircle } from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ListEmptyState } from './ListEmptyState';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type?: string;
  created_at: string;
  read_at?: string | null;
}

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  onNotificationsRead?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  visible,
  onClose,
  onNotificationsRead,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isSupabaseConfigured || !user?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (fetchErr) throw fetchErr;
      setNotifications(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible, fetchNotifications]);

  const handleMarkAllRead = async () => {
    if (!user?.id || notifications.length === 0) return;

    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      if (onNotificationsRead) onNotificationsRead();
    } catch {
      // Ignore error
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-paper rounded-t-[28px] px-5 pt-5 pb-2 max-h-[92%] gap-4">
          <View className="flex-row items-center justify-between">
            <Text accessibilityRole="header" className="text-[30px] leading-[34px] font-display text-ink">
              Notifications
            </Text>

            <View className="flex-row items-center gap-2">
              {notifications.some((n) => !n.read_at) && (
                <TouchableOpacity
                  onPress={handleMarkAllRead}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 flex-row items-center gap-1"
                >
                  <CheckCheck size={12} color="#4A463F" />
                  <Text className="text-xs font-sans-bold text-slate-700">
                    Mark Read
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <X size={16} color="#6E6A63" />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator color="#1C1C1E" size="small" />
              <Text className="text-xs text-slate-500 mt-2 font-sans">
                Fetching notifications...
              </Text>
            </View>
          ) : error ? (
            <View className="py-8 items-center justify-center gap-2">
              <AlertCircle size={28} color="#EF4444" />
              <Text className="text-xs text-rose-600 font-sans-semibold">{error}</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <ListEmptyState
                icon={<Bell size={28} color="#8C877E" />}
                title="No Notifications"
                description="You are completely caught up with all attendance and class updates."
              />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-2.5 pb-8">
              {notifications.map((n) => {
                const isUnread = !n.read_at;
                return (
                  <View
                    key={n.id}
                    className="p-4 rounded-3xl bg-white"
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className={`flex-1 pr-2 text-[15px] text-ink ${isUnread ? 'font-sans-bold' : 'font-sans'}`}>
                        {n.title}
                      </Text>
                      {isUnread && (
                        <View accessibilityLabel="Unread" className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                      )}
                    </View>
                    <Text className="text-[13px] font-sans text-muted leading-[18px]">
                      {n.body}
                    </Text>
                    <View className="flex-row items-center gap-1 mt-2">
                      <Clock size={10} color="#8C877E" />
                      <Text className="text-xs text-slate-500 font-sans">
                        {new Date(n.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};
