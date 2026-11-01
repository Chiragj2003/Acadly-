import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import {
  type FeePlan,
  type StudentFee,
  type PaymentRecord,
  type InAppNotification,
  type AnalyticsSummary,
  type UserRole,
} from '@/types/database';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface FeeNotificationContextType {
  // Fees
  feePlans: FeePlan[];
  studentFees: StudentFee[];
  payments: PaymentRecord[];
  activeCheckoutFee: StudentFee | null;
  selectedReceipt: PaymentRecord | null;
  openRazorpayCheckout: (fee: StudentFee) => void;
  closeRazorpayCheckout: () => void;
  completeRazorpayPayment: (fee: StudentFee, mode?: PaymentRecord['payment_mode']) => Promise<{ success: boolean; payment: PaymentRecord }>;
  openReceipt: (payment: PaymentRecord) => void;
  closeReceipt: () => void;
  createFeePlan: (name: string, amount: number, frequency: FeePlan['frequency']) => Promise<void>;

  // Notifications
  notifications: InAppNotification[];
  unreadCount: number;
  sendNotification: (role: UserRole | 'all', title: string, message: string, type?: InAppNotification['type']) => Promise<void>;
  markAsRead: (id: string) => void;
  isNotificationDrawerOpen: boolean;
  openNotificationDrawer: () => void;
  closeNotificationDrawer: () => void;

  // Analytics
  analytics: AnalyticsSummary;
  refreshAnalytics: () => void;
}

const INITIAL_FEE_PLANS: FeePlan[] = [
  {
    id: 'plan-01',
    institute_id: 'inst-01',
    name: 'Class 12 JEE Advanced Dropper Program',
    amount: 125000,
    frequency: 'annual',
    description: 'Comprehensive academic tuition, study packages, AI test series, and mentorship.',
    created_at: '2025-01-01',
  },
  {
    id: 'plan-02',
    institute_id: 'inst-01',
    name: 'Term 2 Academic & Lab Instalment',
    amount: 15000,
    frequency: 'term',
    description: 'Quarterly laboratory maintenance, daily practice sheets, and discussion classes.',
    created_at: '2025-02-01',
  },
];

const INITIAL_STUDENT_FEES: StudentFee[] = [
  {
    id: 'fee-01',
    institute_id: 'inst-01',
    student_id: 's4',
    student_name: 'Aryan Kapoor',
    roll_number: '#JEE-2025-104',
    title: 'Term 2 Tuition & Lab Fee',
    total_amount: 15000,
    paid_amount: 0,
    pending_amount: 15000,
    status: 'pending',
    due_date: '2025-11-15',
    due_label: 'Due 15th Nov',
    created_at: '2025-10-15',
  },
  {
    id: 'fee-02',
    institute_id: 'inst-01',
    student_id: 's2',
    student_name: 'Ananya Iyer',
    roll_number: '#JEE-2025-102',
    title: 'Quarter 1 Tuition Instalment',
    total_amount: 25000,
    paid_amount: 0,
    pending_amount: 25000,
    status: 'overdue',
    due_date: '2025-10-20',
    due_label: 'Overdue by 12 Days',
    created_at: '2025-09-20',
  },
  {
    id: 'fee-03',
    institute_id: 'inst-01',
    student_id: 's1',
    student_name: 'Aditya Sharma',
    roll_number: '#JEE-2025-101',
    title: 'Annual Foundation Fee',
    total_amount: 85000,
    paid_amount: 85000,
    pending_amount: 0,
    status: 'paid',
    due_date: '2025-09-01',
    due_label: 'Paid in Full',
    created_at: '2025-08-15',
  },
];

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-01',
    institute_id: 'inst-01',
    student_fee_id: 'fee-03',
    student_id: 's1',
    student_name: 'Aditya Sharma',
    amount: 85000,
    payment_mode: 'razorpay',
    razorpay_payment_id: 'pay_OQz91h2jKlm4',
    razorpay_order_id: 'order_OQy78a4bCde1',
    receipt_number: 'APX-REC-2025-0891',
    status: 'success',
    paid_at: '2025-09-01T11:20:00Z',
  },
  {
    id: 'pay-02',
    institute_id: 'inst-01',
    student_fee_id: 'fee-00',
    student_id: 's5',
    student_name: 'Aarav Patel',
    amount: 25000,
    payment_mode: 'upi',
    receipt_number: 'APX-REC-2025-0892',
    status: 'success',
    paid_at: '2025-10-24T09:40:00Z',
  },
];

const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-01',
    institute_id: 'inst-01',
    recipient_role: 'all',
    title: 'Electromagnetism Masterclass LIVE',
    message: 'Er. Rakesh Verma is live in 35 minutes in Room 204 & Hybrid Stream.',
    type: 'lecture',
    is_read: false,
    created_at: '2025-10-24T13:25:00Z',
  },
  {
    id: 'notif-02',
    institute_id: 'inst-01',
    recipient_role: 'student',
    title: 'Rotational Dynamics DPP-04 Due',
    message: 'Submission deadline tomorrow 06:00 PM for physics homework sheet.',
    type: 'assignment',
    is_read: false,
    created_at: '2025-10-24T10:00:00Z',
  },
  {
    id: 'notif-03',
    institute_id: 'inst-01',
    recipient_role: 'parent',
    title: 'Attendance Confirmed',
    message: 'Aryan Kapoor marked Present for Physics Class 12-A at 10:02 AM.',
    type: 'attendance',
    is_read: true,
    created_at: '2025-10-24T10:02:00Z',
  },
  {
    id: 'notif-04',
    institute_id: 'inst-01',
    recipient_role: 'admin',
    title: 'Batch Fee Cycle Overdue',
    message: '34 parents pending reminders. WhatsApp templates ready for dispatch.',
    type: 'fee',
    is_read: false,
    created_at: '2025-10-24T08:30:00Z',
  },
];

const INITIAL_ANALYTICS: AnalyticsSummary = {
  enrolled_students: 842,
  faculty_count: 24,
  active_batches: 18,
  today_attendance_rate: 94.2,
  present_count: 793,
  absent_count: 49,
  total_collected_amount: 14520000,
  total_pending_dues: 485000,
  overdue_students_count: 34,
};

const FeeNotificationContext = createContext<FeeNotificationContextType | undefined>(undefined);

export const FeeNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeInstitute } = useAuth();

  const [feePlans, setFeePlans] = useState<FeePlan[]>(INITIAL_FEE_PLANS);
  const [studentFees, setStudentFees] = useState<StudentFee[]>(INITIAL_STUDENT_FEES);
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [activeCheckoutFee, setActiveCheckoutFee] = useState<StudentFee | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  const [notifications, setNotifications] = useState<InAppNotification[]>(INITIAL_NOTIFICATIONS);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(INITIAL_ANALYTICS);

  useEffect(() => {
    // Request push notification permissions on supported devices
    (async () => {
      if (Platform.OS !== 'web') {
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
        } catch {
          // ignore in simulator / non-expo environment
        }
      }
    })();
  }, []);

  const openRazorpayCheckout = (fee: StudentFee) => {
    setActiveCheckoutFee(fee);
  };

  const closeRazorpayCheckout = () => {
    setActiveCheckoutFee(null);
  };

  const completeRazorpayPayment = async (
    fee: StudentFee,
    mode: PaymentRecord['payment_mode'] = 'razorpay'
  ) => {
    const paymentId = `pay_${Date.now().toString(36)}`;
    const orderId = `order_${Date.now().toString(36)}`;
    const receiptNum = `APX-REC-2025-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment: PaymentRecord = {
      id: `payment-${Date.now()}`,
      institute_id: activeInstitute?.id || 'inst-01',
      student_fee_id: fee.id,
      student_id: fee.student_id,
      student_name: fee.student_name,
      amount: fee.pending_amount,
      payment_mode: mode,
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      receipt_number: receiptNum,
      status: 'success',
      paid_at: new Date().toISOString(),
    };

    // Update fee ledger
    setStudentFees((prev) =>
      prev.map((f) =>
        f.id === fee.id
          ? {
              ...f,
              paid_amount: f.total_amount,
              pending_amount: 0,
              status: 'paid',
              due_label: 'Paid in Full',
            }
          : f
      )
    );

    // Save payment
    setPayments((prev) => [newPayment, ...prev]);
    setActiveCheckoutFee(null);
    setSelectedReceipt(newPayment);

    // Trigger in-app notification & system push
    await sendNotification(
      'all',
      'Payment Received (₹' + fee.pending_amount.toLocaleString('en-IN') + ')',
      `Payment of ₹${fee.pending_amount.toLocaleString('en-IN')} for ${fee.student_name} was successful. Receipt #${receiptNum} generated.`,
      'fee'
    );

    // Sync to Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('payments').insert(newPayment);
        await supabase
          .from('student_fees')
          .update({
            paid_amount: fee.total_amount,
            pending_amount: 0,
            status: 'paid',
          })
          .eq('id', fee.id);
      } catch {
        // fallback
      }
    }

    return { success: true, payment: newPayment };
  };

  const openReceipt = (payment: PaymentRecord) => {
    setSelectedReceipt(payment);
  };

  const closeReceipt = () => {
    setSelectedReceipt(null);
  };

  const createFeePlan = async (
    name: string,
    amount: number,
    frequency: FeePlan['frequency']
  ) => {
    const newPlan: FeePlan = {
      id: `plan-${Date.now()}`,
      institute_id: activeInstitute?.id || 'inst-01',
      name,
      amount,
      frequency,
      created_at: new Date().toISOString(),
    };
    setFeePlans((prev) => [newPlan, ...prev]);
  };

  const sendNotification = async (
    role: UserRole | 'all',
    title: string,
    message: string,
    type: InAppNotification['type'] = 'broadcast'
  ) => {
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}`,
      institute_id: activeInstitute?.id || 'inst-01',
      recipient_role: role,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Send local push notification via Expo Notifications
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: { type },
        },
        trigger: null,
      });
    } catch {
      // ignore on web
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const openNotificationDrawer = () => setIsNotificationDrawerOpen(true);
  const closeNotificationDrawer = () => setIsNotificationDrawerOpen(false);

  const refreshAnalytics = () => {
    setAnalytics({
      enrolled_students: 842,
      faculty_count: 24,
      active_batches: 18,
      today_attendance_rate: 94.2,
      present_count: 793,
      absent_count: 49,
      total_collected_amount: 14520000,
      total_pending_dues: 485000,
      overdue_students_count: 34,
    });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <FeeNotificationContext.Provider
      value={{
        feePlans,
        studentFees,
        payments,
        activeCheckoutFee,
        selectedReceipt,
        openRazorpayCheckout,
        closeRazorpayCheckout,
        completeRazorpayPayment,
        openReceipt,
        closeReceipt,
        createFeePlan,
        notifications,
        unreadCount,
        sendNotification,
        markAsRead,
        isNotificationDrawerOpen,
        openNotificationDrawer,
        closeNotificationDrawer,
        analytics,
        refreshAnalytics,
      }}
    >
      {children}
    </FeeNotificationContext.Provider>
  );
};

export const useFeeNotification = () => {
  const context = useContext(FeeNotificationContext);
  if (!context) {
    throw new Error('useFeeNotification must be used within FeeNotificationProvider');
  }
  return context;
};
