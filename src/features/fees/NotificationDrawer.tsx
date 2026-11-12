import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Alert } from 'react-native';
import {
  Bell,
  X,
  MessageSquare,
  BookOpen,
  CalendarCheck,
  Wallet,
  CheckCheck,
  Send,
} from 'lucide-react-native';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, Badge, type BadgeVariant } from '@/components/ui';

export const NotificationDrawer: React.FC = () => {
  const {
    notifications,
    isNotificationDrawerOpen,
    closeNotificationDrawer,
    markAsRead,
    sendNotification,
  } = useFeeNotification();
  const { userRole } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'all' | 'fee' | 'attendance' | 'lecture'>('all');

  if (!isNotificationDrawerOpen) return null;

  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === activeFilter);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'attendance':
        return <CalendarCheck size={16} color="#069669" />;
      case 'fee':
        return <Wallet size={16} color="#ba1a1a" />;
      case 'lecture':
        return <BookOpen size={16} color="#0051d5" />;
      default:
        return <MessageSquare size={16} color="#45464d" />;
    }
  };

  const handleSendTestBroadcast = async () => {
    await sendNotification(
      'all',
      'Academy Update: Mock Test Schedule',
      'The upcoming All-India JEE Mock Test Discussion is scheduled for 4:00 PM today.',
      'broadcast'
    );
    Alert.alert('Broadcast Dispatched', 'Notification sent to all enrolled students and parents.');
  };

  return (
    <Modal visible={isNotificationDrawerOpen} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-surface rounded-t-3xl overflow-hidden max-h-[85%] flex-col">
          {/* Header */}
          <View className="h-14 px-4 flex-row items-center justify-between border-b border-black/5 bg-surface-container-low">
            <View className="flex-row items-center gap-2">
              <Bell size={18} color="#0051d5" />
              <Text className="text-sm font-bold text-on-surface">Notifications</Text>
              <Badge label={`${notifications.length} Alerts`} variant="info" />
            </View>

            <Pressable
              onPress={closeNotificationDrawer}
              className="w-8 h-8 rounded-full bg-surface-container-highest items-center justify-center"
            >
              <X size={18} color="#0b1c30" />
            </Pressable>
          </View>

          {/* Filter Pills */}
          <View className="p-3 border-b border-black/5 flex-row items-center justify-between bg-surface">
            <View className="flex-row items-center gap-1.5 flex-1">
              {(['all', 'attendance', 'fee', 'lecture'] as const).map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setActiveFilter(cat)}
                  className={`px-2.5 py-1 rounded-xl ${
                    activeFilter === cat ? 'bg-primary' : 'bg-surface-container'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold capitalize ${
                      activeFilter === cat ? 'text-on-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>

            {(userRole === 'admin' || userRole === 'teacher') && (
              <Button
                size="sm"
                variant="surface"
                title="Broadcast"
                leftIcon={<Send size={12} color="#0051d5" />}
                onPress={handleSendTestBroadcast}
              />
            )}
          </View>

          {/* Notifications List */}
          <ScrollView className="p-4 flex-col" contentContainerClassName="gap-2.5 pb-6">
            {filtered.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => markAsRead(item.id)}
                className={`p-3.5 rounded-2xl flex-row items-start gap-3 border ${
                  !item.is_read
                    ? 'bg-surface-container-lowest border-secondary/30 shadow-xs'
                    : 'bg-surface-container-low border-transparent opacity-80'
                }`}
              >
                <View className="w-8 h-8 rounded-xl bg-surface-container items-center justify-center shrink-0 mt-0.5">
                  {getIconForType(item.type)}
                </View>

                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center justify-between gap-1 mb-0.5">
                    <Text className="text-xs font-bold text-on-surface flex-1" numberOfLines={1}>
                      {item.title}
                    </Text>
                    {!item.is_read && (
                      <View className="w-2 h-2 rounded-full bg-secondary" />
                    )}
                  </View>
                  <Text className="text-xs text-on-surface-variant leading-snug">
                    {item.message}
                  </Text>
                  <Text className="text-[10px] text-on-surface-variant font-medium mt-1">
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
