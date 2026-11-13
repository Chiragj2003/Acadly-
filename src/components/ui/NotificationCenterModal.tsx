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
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 max-h-[85%] border-t border-slate-200 dark:border-slate-800 gap-3">
          <View className="flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 items-center justify-center">
                <Bell size={16} color="#2563EB" />
              </View>
              <View>
                <Text className="text-base font-black text-slate-900 dark:text-slate-100">
                  Notification Center
                </Text>
                <Text className="text-[11px] text-slate-500">
                  Academic, homework and attendance alerts
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              {notifications.some((n) => !n.read_at) && (
                <TouchableOpacity
                  onPress={handleMarkAllRead}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex-row items-center gap-1"
                >
                  <CheckCheck size={12} color="#475569" />
                  <Text className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    Mark Read
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
              >
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator color="#2563EB" size="small" />
              <Text className="text-xs text-slate-500 mt-2 font-medium">
                Fetching notifications...
              </Text>
            </View>
          ) : error ? (
            <View className="py-8 items-center justify-center gap-2">
              <AlertCircle size={28} color="#EF4444" />
              <Text className="text-xs text-rose-600 font-semibold">{error}</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <ListEmptyState
                icon={<Bell size={28} color="#94A3B8" />}
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
                    className={`p-3.5 rounded-2xl border ${
                      isUnread
                        ? 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'
                        : 'bg-white border-slate-200/80 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {n.title}
                      </Text>
                      {isUnread && (
                        <View className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </View>
                    <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {n.body}
                    </Text>
                    <View className="flex-row items-center gap-1 mt-2">
                      <Clock size={10} color="#94A3B8" />
                      <Text className="text-[10px] text-slate-500 font-medium">
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
