import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import {
  Users,
  CalendarCheck,
  Trophy,
  Wallet,
  ShieldCheck,
  ChevronRight,
  CreditCard,
  FileText,
  Sparkles,
  Heart,
  CheckCircle2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useInstitute } from '@/context/InstituteContext';
import { useChild } from '@/context/ChildContext';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import {
  ScreenWrapper,
  Badge,
  Mascot,
} from '@/components/ui';
import {
  RazorpayCheckoutModal,
  FeeReceiptModal,
  NotificationDrawer,
} from '@/components/finance';

export default function CuteParentScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { currentInstitute } = useInstitute();
  const { selectedChild, childrenList, selectChild } = useChild();
  const {
    studentFees,
    payments,
    openRazorpayCheckout,
    openReceipt,
    openNotificationDrawer,
    unreadCount,
  } = useFeeNotification();

  const currentFee = studentFees[0];
  const lastPayment = payments[0];

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Parent Corner 🏡',
        instituteName: currentInstitute?.name || 'Bloom Academy',
        onNotificationPress: openNotificationDrawer,
        onProfilePress: () => {
          Alert.alert(
            'Sunita Sharma 🏡',
            'Primary Guardian • Enrolled: Amelia Sharma',
            [
              {
                text: 'Sign Out 🚪',
                style: 'destructive',
                onPress: async () => {
                  await signOut();
                  router.replace('/auth');
                },
              },
              { text: 'Close', style: 'cancel' },
            ]
          );
        },
        hasUnreadNotifications: unreadCount > 0,
      }}
    >
      {/* 1. Child Switcher with Cute Avatars */}
      <View className="bg-white border-2 border-cute-border rounded-[28px] p-4 mb-4 shadow-xs">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-1.5">
            <Heart size={16} color="#ff7d6b" fill="#ff7d6b" />
            <Text className="text-xs font-bold text-cute-cocoa uppercase tracking-wider">
              Your Enrolled Children
            </Text>
          </View>
          <Text className="text-[11px] font-semibold text-cute-peach">Tap to switch</Text>
        </View>

        <View className="flex-row gap-2.5">
          {childrenList.map((c) => {
            const isSelected = selectedChild?.id === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => selectChild(c.id)}
                className={`flex-1 p-3 rounded-2xl flex-row items-center gap-2.5 border-2 ${
                  isSelected
                    ? 'bg-cute-peach-light border-cute-peach shadow-xs'
                    : 'bg-cute-cream border-cute-border'
                }`}
              >
                <View className="w-10 h-10 rounded-full bg-white border border-black/10 items-center justify-center">
                  <Text className="text-xl">{c.emoji || '🌸'}</Text>
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-xs font-black text-cute-cocoa" numberOfLines={1}>
                    {c.full_name}
                  </Text>
                  <Text className="text-[10px] text-cute-muted" numberOfLines={1}>
                    {c.batch_name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. Selected Child Attendance & Progress Summary */}
      <View className="bg-white border-2 border-cute-border rounded-[28px] p-5 mb-4 shadow-xs">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Mascot mood="celebrating" size="sm" />
            <View>
              <Text className="text-base font-extrabold text-cute-cocoa">
                {selectedChild?.full_name}'s Progress 🌟
              </Text>
              <Text className="text-xs text-cute-muted">Weekly attendance & test performance</Text>
            </View>
          </View>
          <View className="bg-cute-mint-light px-2.5 py-1 rounded-full border border-cute-mint">
            <Text className="text-[11px] font-bold text-cute-mint">96.4% Regular</Text>
          </View>
        </View>

        <View className="flex-row gap-2.5 mt-2">
          <View className="flex-1 bg-cute-cream border border-cute-border rounded-2xl p-3 items-center">
            <CalendarCheck size={18} color="#52b788" />
            <Text className="text-xs font-semibold text-cute-muted mt-1">Present</Text>
            <Text className="text-lg font-black text-cute-cocoa">26 Days</Text>
          </View>

          <View className="flex-1 bg-cute-cream border border-cute-border rounded-2xl p-3 items-center">
            <Trophy size={18} color="#f59e0b" />
            <Text className="text-xs font-semibold text-cute-muted mt-1">Batch Rank</Text>
            <Text className="text-lg font-black text-cute-cocoa">#01 / 28</Text>
          </View>

          <View className="flex-1 bg-cute-cream border border-cute-border rounded-2xl p-3 items-center">
            <Sparkles size={18} color="#ff7d6b" />
            <Text className="text-xs font-semibold text-cute-muted mt-1">Homework</Text>
            <Text className="text-lg font-black text-cute-cocoa">100% Done</Text>
          </View>
        </View>
      </View>

      {/* 3. Tuition Fee Ledger Card */}
      <View className="bg-white border-2 border-cute-border rounded-[28px] p-5 mb-4 shadow-xs">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Wallet size={18} color="#ff7d6b" />
            <Text className="text-base font-extrabold text-cute-cocoa">Tuition Fee Ledger 💳</Text>
          </View>
          <Badge label="Due in 12 Days" variant="warning" />
        </View>

        <View className="bg-cute-cream p-4 rounded-2xl border border-cute-border mb-4">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-xs text-cute-muted">Course Term Plan</Text>
            <Text className="text-xs font-bold text-cute-cocoa">Class 11 Full Academic Year</Text>
          </View>
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-xs text-cute-muted">Total Term Fee (incl. 18% GST)</Text>
            <Text className="text-xs font-bold text-cute-cocoa">₹45,000</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-cute-muted">Scholarship Discount</Text>
            <Text className="text-xs font-bold text-cute-mint">- ₹5,000</Text>
          </View>

          <View className="pt-2 border-t border-cute-border flex-row justify-between items-center">
            <Text className="text-sm font-extrabold text-cute-cocoa">Remaining Due Balance</Text>
            <Text className="text-xl font-black text-cute-peach">₹15,000</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => currentFee && openRazorpayCheckout(currentFee)}
          className="bg-cute-peach py-3 rounded-2xl flex-row items-center justify-center gap-2 shadow-xs active:scale-98"
        >
          <CreditCard size={16} color="#ffffff" />
          <Text className="text-sm font-bold text-white">Pay Online via UPI / Card (Razorpay)</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Recent Payment Receipts */}
      {lastPayment && (
        <View className="bg-white border-2 border-cute-border rounded-[28px] p-5 shadow-xs mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <CheckCircle2 size={18} color="#52b788" />
              <Text className="text-base font-extrabold text-cute-cocoa">Recent Receipts 📄</Text>
            </View>
            <Text className="text-xs text-cute-muted">Official GST Invoice</Text>
          </View>

          <TouchableOpacity
            onPress={() => openReceipt(lastPayment)}
            className="bg-cute-cream border border-cute-border rounded-2xl p-3.5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-white border border-cute-border items-center justify-center">
                <FileText size={18} color="#ff7d6b" />
              </View>
              <View>
                <Text className="text-xs font-black text-cute-cocoa">{lastPayment.receipt_number}</Text>
                <Text className="text-[11px] text-cute-muted">Paid ₹{lastPayment.amount.toLocaleString()} • Razorpay UPI</Text>
              </View>
            </View>
            <Text className="text-xs font-bold text-cute-peach">View & Share →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modals */}
      <RazorpayCheckoutModal />
      <FeeReceiptModal />
      <NotificationDrawer />
    </ScreenWrapper>
  );
}
