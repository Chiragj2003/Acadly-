import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import {
  Users,
  CalendarCheck,
  Trophy,
  Wallet,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  CreditCard,
  FileText,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import {
  ScreenWrapper,
  MetricCard,
  Button,
  Badge,
  Card,
} from '@/components/ui';
import {
  RazorpayCheckoutModal,
  FeeReceiptModal,
  NotificationDrawer,
} from '@/components/finance';

export default function ParentScreen() {
  const { activeInstitute } = useAuth();
  const {
    studentFees,
    payments,
    openRazorpayCheckout,
    openReceipt,
    openNotificationDrawer,
    unreadCount,
  } = useFeeNotification();

  const [selectedChild, setSelectedChild] = useState('Aryan Kapoor');

  const currentFee = studentFees.find((f) => f.student_name.includes('Aryan')) || studentFees[0];
  const lastPayment = payments[0];

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Parent Desk',
        instituteName: activeInstitute?.name,
        onNotificationPress: openNotificationDrawer,
        onProfilePress: () => Alert.alert('Parent Profile', 'Suresh Kapoor • Guardian'),
        hasUnreadNotifications: unreadCount > 0,
      }}
    >
      {/* Linked Child Snapshot */}
      <Card elevation="low" className="p-3.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1 min-w-0">
          <View className="w-12 h-12 rounded-full bg-secondary/10 items-center justify-center">
            <Users size={22} color="#0051d5" />
          </View>
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-base font-bold text-on-surface" numberOfLines={1}>
                {selectedChild}
              </Text>
              <Badge label="Class 12 Science" variant="info" />
            </View>
            <Text className="text-xs text-on-surface-variant mt-0.5" numberOfLines={1}>
              Roll #JEE-2025-104 • Center: {activeInstitute?.name}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => Alert.alert('Linked Children', '1. Aryan Kapoor (Class 12)\n2. Ria Kapoor (Class 9)')}
          className="px-2.5 py-1 rounded-lg bg-surface-container"
        >
          <Text className="text-xs font-semibold text-secondary">Switch</Text>
        </Pressable>
      </Card>

      {/* Child Academic & Attendance Vitals */}
      <View className="gap-2">
        <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">
          Child Progress & Vitals
        </Text>

        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <MetricCard
              title="Attendance Rate"
              value="96.4%"
              trendText="Present Today"
              trendDirection="positive"
              icon={<CalendarCheck size={16} color="#069669" />}
            />
          </View>
          <View className="flex-1">
            <MetricCard
              title="Latest Mock Test"
              value="248"
              subValue="/300"
              trendText="Rank AIR 142"
              trendDirection="positive"
              icon={<Trophy size={16} color="#0051d5" />}
            />
          </View>
        </View>
      </View>

      {/* Fee Payment Status & Quick Pay with Razorpay */}
      <Card elevation="lowest" className="gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-surface-container items-center justify-center">
              <Wallet size={16} color="#0051d5" />
            </View>
            <View>
              <Text className="text-xs font-bold text-on-surface">{currentFee.title}</Text>
              <Text className="text-[11px] text-on-surface-variant">{currentFee.due_label}</Text>
            </View>
          </View>

          <Badge
            label={currentFee.status === 'paid' ? 'Paid in Full' : 'Due in 14 Days'}
            variant={currentFee.status === 'paid' ? 'success' : 'warning'}
          />
        </View>

        <View className="flex-row items-baseline justify-between pt-1">
          <Text className="text-xs text-on-surface-variant">Amount Payable:</Text>
          <Text className="text-xl font-bold text-on-surface">
            ₹{currentFee.pending_amount.toLocaleString('en-IN')}
          </Text>
        </View>

        <View className="flex-row gap-2 pt-1 border-t border-black/5">
          <View className="flex-1">
            <Button
              size="sm"
              variant={currentFee.status === 'paid' ? 'surface' : 'primary'}
              title={currentFee.status === 'paid' ? 'Paid' : 'Pay via Razorpay / UPI'}
              leftIcon={<CreditCard size={14} color={currentFee.status === 'paid' ? '#069669' : '#ffffff'} />}
              disabled={currentFee.status === 'paid'}
              fullWidth
              onPress={() => openRazorpayCheckout(currentFee)}
            />
          </View>
          <Button
            size="sm"
            variant="surface"
            title="Receipt"
            leftIcon={<FileText size={14} color="#0b1c30" />}
            onPress={() => lastPayment && openReceipt(lastPayment)}
          />
        </View>
      </Card>

      {/* Academy Communications & Broadcast Log */}
      <View className="gap-2">
        <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">
          SMS & WhatsApp Alerts
        </Text>

        <Card elevation="lowest" className="p-0 overflow-hidden divide-y divide-black/5">
          <View className="p-3 flex-row items-start gap-3">
            <View className="w-8 h-8 rounded-full bg-on-tertiary-container/10 items-center justify-center shrink-0">
              <MessageSquare size={16} color="#069669" />
            </View>
            <View className="flex-1 min-w-0">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-on-surface">Arrival Confirmed</Text>
                <Text className="text-[11px] text-on-surface-variant">Today 09:58 AM</Text>
              </View>
              <Text className="text-xs text-on-surface mt-0.5">
                Aryan entered Kota Campus for Physics Class 12-A.
              </Text>
            </View>
          </View>

          <View className="p-3 flex-row items-start gap-3">
            <View className="w-8 h-8 rounded-full bg-surface-container items-center justify-center shrink-0">
              <ShieldCheck size={16} color="#0051d5" />
            </View>
            <View className="flex-1 min-w-0">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-on-surface">Exam Result Published</Text>
                <Text className="text-[11px] text-on-surface-variant">Yesterday</Text>
              </View>
              <Text className="text-xs text-on-surface mt-0.5">
                JEE Mock Test 04 scores are now available. Score: 248/300.
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Modals */}
      <RazorpayCheckoutModal />
      <FeeReceiptModal />
      <NotificationDrawer />
    </ScreenWrapper>
  );
}
