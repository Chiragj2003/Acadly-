import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  Linking,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
  CheckCircle2,
  Home,
  MessageSquare,
  LogOut,
  Plus,
  X,
  Phone,
  Clock,
  Download,
  Share2,
  Award,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { useInstitute } from '@/context/InstituteContext';
import { useChild, ChildStudent } from '@/context/ChildContext';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import { useAcademic } from '@/context/AcademicContext';
import {
  ScreenWrapper,
  Badge,
  BottomTabBar,
  type TabItem,
} from '@/components/ui';
import {
  PerformanceComparisonChart,
  AttendanceRingAndTrendChart,
} from '@/components/charts';
import {
  RazorpayCheckoutModal,
  FeeReceiptModal,
  NotificationDrawer,
} from '@/components/finance';
import { generateAndSharePDF, DUMMY_PDF_CATALOG } from '@/services/dummyPdfService';
import { FEATURE_FEES } from '@/config/features';

export default function PinterestParentScreen() {
  const { isAuthorized, isLoading } = useRoleGuard(["parent","admin"]);
  const router = useRouter();
  const { signOut } = useAuth();
  const { currentInstitute } = useInstitute();
  const { selectedChild, childrenList, selectChild, addChildByCodeOrPhone } = useChild();
  const {
    studentFees,
    payments,
    openRazorpayCheckout,
    openReceipt,
    openNotificationDrawer,
    unreadCount,
  } = useFeeNotification();
  const { comparisonChartData, studentsRoster } = useAcademic();

  // Bottom Navigation Tabs (4 Tabs)
  const [activeTab, setActiveTab] = useState<'home' | 'children' | 'fees_reports' | 'profile'>('home');

  // Link Child Modal State
  const [isLinkChildModalOpen, setIsLinkChildModalOpen] = useState(false);
  const [childCodeInput, setChildCodeInput] = useState('');
  const [isLinkingChild, setIsLinkingChild] = useState(false);

  // Settings Toggles
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [waDailyDigest, setWaDailyDigest] = useState(true);

  const currentFee = studentFees[0];
  const lastPayment = payments[0];
  const matchedStudentProfile =
    studentsRoster.find((s) =>
      selectedChild?.full_name?.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]) ||
      s.name.toLowerCase().includes(selectedChild?.full_name?.toLowerCase() || '')
    ) ||
    studentsRoster.find((s) => s.id === 'stud-amelia') ||
    studentsRoster[0];

  const handleLogout = () => {
    Alert.alert(
      'Sign Out 🚪',
      'Are you sure you want to sign out from the Parent Portal?',
      [
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleLinkChild = async () => {
    if (!childCodeInput.trim()) {
      Alert.alert('Required', 'Please enter a Student Link Code or registered phone number.');
      return;
    }
    setIsLinkingChild(true);
    const res = await addChildByCodeOrPhone(childCodeInput.trim());
    setIsLinkingChild(false);

    if (res.success && res.child) {
      setIsLinkChildModalOpen(false);
      setChildCodeInput('');
      Alert.alert('Child Linked! 🎓', `Successfully connected ${res.child.full_name} to your parent portal.`);
    } else {
      Alert.alert('Not Found', res.error || 'Could not verify student code. Please check with the tuition teacher.');
    }
  };

  const handleWhatsAppTeacher = () => {
    const message = encodeURIComponent(
      `Namaste from ${selectedChild?.full_name}'s parent. I wanted to inquire about recent homework and exam feedback on Acadly.`
    );
    Linking.openURL(`https://wa.me/919823044551?text=${message}`).catch(() => {
      Alert.alert('WhatsApp Teacher', 'Connecting to tuition teacher at +91 98230 44551');
    });
  };

  const handleDownloadInvoice = async () => {
    const dummyDoc = DUMMY_PDF_CATALOG[0];
    await generateAndSharePDF(dummyDoc);
  };

  const tabs: TabItem[] = [
    {
      key: 'home',
      label: 'Home',
      icon: (color, size) => <Home color={color} size={size} />,
    },
    {
      key: 'children',
      label: 'Children',
      icon: (color, size) => <Users color={color} size={size} />,
      badgeCount: childrenList.length,
    },
    {
      key: 'fees_reports',
      label: FEATURE_FEES ? 'Fees & Invoices' : 'Progress Reports',
      icon: (color, size) => (FEATURE_FEES ? <Wallet color={color} size={size} /> : <Award color={color} size={size} />),
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: (color, size) => <ShieldCheck color={color} size={size} />,
    },
  ];

  
  if (isLoading || !isAuthorized) {
    return (
      <ScreenWrapper headerProps={{ title: 'Parent Portal' }}>
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="small" color="#2563EB" />
          <Text className="text-xs text-slate-500 mt-2 font-medium">Verifying authorization...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Parent Portal',
        instituteName: currentInstitute?.name || 'Bloom Science Academy',
        profileInitials: 'RS',
        onNotificationPress: openNotificationDrawer,
        onProfilePress: () => {
          Alert.alert(
            'Rajesh Sharma',
            `Primary Guardian • Enrolled: ${selectedChild?.full_name || 'Amelia Sharma'}\nPhone: +91 98230 44551`,
            [
              { text: 'Sign Out 🚪', style: 'destructive', onPress: handleLogout },
              { text: 'Close', style: 'cancel' },
            ]
          );
        },
        onLogoutPress: handleLogout,
        hasUnreadNotifications: unreadCount > 0,
      }}
      contentContainerClassName="gap-3.5 px-4 py-4"
      footer={
        <BottomTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as any)}
          accentColor="#2563EB"
        />
      }
    >
      {/* Child Selector Strip */}
        <View className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs">
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Children ({childrenList.length})
            </Text>
            <TouchableOpacity
              onPress={() => setIsLinkChildModalOpen(true)}
              className="flex-row items-center gap-1 active:scale-95"
            >
              <Plus size={13} color="#2563EB" />
              <Text className="text-xs font-bold text-blue-600">Link Child</Text>
            </TouchableOpacity>
          </View>

          {childrenList.length === 0 ? (
            <TouchableOpacity
              onPress={() => setIsLinkChildModalOpen(true)}
              className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 items-center justify-center gap-1 active:scale-98"
            >
              <Text className="text-xs font-bold text-slate-700">No student accounts linked yet</Text>
              <Text className="text-[11px] text-blue-600 font-semibold">+ Tap here to enter your ward's Student Link Code</Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row gap-2">
              {childrenList.map((c) => {
                const isSelected = selectedChild?.id === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => selectChild(c.id)}
                    className={`flex-1 p-3 rounded-2xl flex-row items-center gap-2.5 border-2 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <View className="w-9 h-9 rounded-full bg-white border border-slate-200 items-center justify-center">
                      <Text className="text-base">{c.emoji || '🎓'}</Text>
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>
                        {c.full_name}
                      </Text>
                      <Text className="text-[10px] text-slate-500" numberOfLines={1}>
                        {c.batch_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ================= TAB 1: HOME ================= */}
        {activeTab === 'home' && (
          <View className="gap-3.5">
            {/* 1. Daily Roll Call Status Card */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <CalendarCheck size={18} color="#059669" />
                  <Text className="text-sm font-bold text-slate-900">Today's Attendance</Text>
                </View>
                <Badge label="Present in Class" variant="success" showDot />
              </View>

              <View className="flex-row items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <View>
                  <Text className="text-xs font-bold text-slate-800">
                    {selectedChild?.full_name} checked in at 09:28 AM
                  </Text>
                  <Text className="text-[11px] text-slate-500 mt-0.5">
                    {selectedChild?.batch_name || 'Class 12 • JEE Advanced (Morning)'} • Roll No: {matchedStudentProfile.rollNumber}
                  </Text>
                </View>
                <View className="bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Text className="text-[10px] font-bold text-emerald-800">{matchedStudentProfile.overallAttendance}% Overall</Text>
                </View>
              </View>
            </View>

            {/* 2. Recent Test Benchmark Graph */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Trophy size={18} color="#d97706" />
                  <Text className="text-sm font-bold text-slate-900">Academic Benchmarks</Text>
                </View>
                <Badge label={`Top ${100 - matchedStudentProfile.percentile}% (${matchedStudentProfile.percentile}th Pctl)`} variant="warning" />
              </View>

              <PerformanceComparisonChart data={comparisonChartData} />
            </View>

            {/* 3. Connect with Tuition Teacher */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <MessageSquare size={16} color="#2563EB" />
                  <Text className="text-sm font-bold text-slate-900">Connect with Teacher</Text>
                </View>
                <Badge label="Active Today" variant="info" />
              </View>

              <Text className="text-xs text-slate-600 leading-relaxed">
                Direct in-app messaging channel with {selectedChild?.batch_name || 'tuition'} faculty. Inquire about test corrections, homework, and attendance.
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/chat')}
                className="bg-blue-600 py-3 rounded-2xl items-center flex-row justify-center gap-2 active:scale-98 shadow-xs"
              >
                <MessageSquare size={16} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Open In-App Faculty Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= TAB 2: CHILDREN DETAILS ================= */}
        {activeTab === 'children' && (
          <View className="gap-3.5">
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-900">Student Profile & Vitals</Text>
                <TouchableOpacity
                  onPress={() => setIsLinkChildModalOpen(true)}
                  className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl active:scale-95"
                >
                  <Text className="text-xs font-bold text-blue-600">+ Link Another Child</Text>
                </TouchableOpacity>
              </View>

              <View className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 gap-2.5">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Full Name:</Text>
                  <Text className="text-xs font-bold text-slate-800">{selectedChild?.full_name}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Admission No:</Text>
                  <Text className="text-xs font-mono font-bold text-slate-800">{selectedChild?.admission_number}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Class & Grade:</Text>
                  <Text className="text-xs font-bold text-slate-800">{selectedChild?.grade}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Assigned Batch:</Text>
                  <Text className="text-xs font-bold text-blue-600">{selectedChild?.batch_name}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Parent Link Code:</Text>
                  <Text className="text-xs font-mono font-bold text-slate-800">{selectedChild?.parent_code}</Text>
                </View>
              </View>

              {/* Attendance Breakdown */}
              <AttendanceRingAndTrendChart percentage={matchedStudentProfile.overallAttendance} />
            </View>
          </View>
        )}

        {/* ================= TAB 3: FEES / PROGRESS REPORTS ================= */}
        {activeTab === 'fees_reports' && (
          <View className="gap-3.5">
            {FEATURE_FEES ? (
              <>
                {/* Tuition Fee Ledger Card */}
                <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Wallet size={18} color="#2563EB" />
                      <Text className="text-sm font-bold text-slate-900">Tuition Fee Ledger</Text>
                    </View>
                    <Badge label="Due in 12 Days" variant="warning" />
                  </View>

                  <View className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 gap-2">
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-slate-500">Academic Term Plan</Text>
                      <Text className="text-xs font-bold text-slate-800">Class 11 Full Term (Physics & Math)</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-slate-500">Gross Term Fee</Text>
                      <Text className="text-xs font-bold text-slate-800">₹45,000</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-slate-500">Scholarship Concession</Text>
                      <Text className="text-xs font-bold text-emerald-700">- ₹5,000</Text>
                    </View>
                    <View className="pt-2 border-t border-slate-200 flex-row justify-between items-center">
                      <Text className="text-sm font-bold text-slate-900">Remaining Balance Due</Text>
                      <Text className="text-xl font-black text-blue-600">₹15,000</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => currentFee && openRazorpayCheckout(currentFee)}
                    className="bg-blue-600 py-3 rounded-2xl flex-row items-center justify-center gap-2 shadow-xs active:scale-98"
                  >
                    <CreditCard size={16} color="#ffffff" />
                    <Text className="text-xs font-bold text-white">Pay Online via UPI / Netbanking</Text>
                  </TouchableOpacity>
                </View>

                {/* Official Tax Invoices & Receipts */}
                <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <FileText size={18} color="#059669" />
                      <Text className="text-sm font-bold text-slate-900">Payment Invoices & Receipts</Text>
                    </View>
                    <Badge label="GST Compliant" variant="neutral" />
                  </View>

                  {lastPayment && (
                    <View className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1 pr-2">
                        <View className="w-10 h-10 rounded-xl bg-white border border-slate-200 items-center justify-center">
                          <FileText size={18} color="#2563EB" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-slate-900">{lastPayment.receipt_number}</Text>
                          <Text className="text-[11px] text-slate-500">Paid ₹{lastPayment.amount.toLocaleString()} • Razorpay UPI</Text>
                        </View>
                      </View>

                      <View className="flex-row gap-1.5">
                        <TouchableOpacity
                          onPress={() => openReceipt(lastPayment)}
                          className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl active:scale-95"
                        >
                          <Text className="text-xs font-bold text-blue-600">View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleDownloadInvoice}
                          className="bg-blue-600 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1 active:scale-95"
                        >
                          <Download size={12} color="#ffffff" />
                          <Text className="text-xs font-bold text-white">PDF</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <>
                {/* Official Progress Report Card */}
                <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Award size={18} color="#2563EB" />
                      <Text className="text-sm font-bold text-slate-900">Official Term Report Card</Text>
                    </View>
                    <Badge label="Term 1 Evaluated" variant="success" />
                  </View>

                  <View className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 gap-2.5">
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-slate-500">Student Name</Text>
                      <Text className="text-xs font-bold text-slate-800">{selectedChild?.full_name || 'Student'}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-slate-500">Academic Standing</Text>
                      <Text className="text-xs font-bold text-emerald-700">Top 5% • Rank 2</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-slate-500">Overall Score</Text>
                      <Text className="text-xs font-black text-blue-600">92.4% Aggregate</Text>
                    </View>
                    <View className="pt-2 border-t border-slate-200 flex-row justify-between items-center">
                      <Text className="text-xs text-slate-600 font-medium">Faculty Remark:</Text>
                      <Text className="text-xs text-slate-800 font-bold">Consistent mastery in Calculus & Mechanics</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => generateAndSharePDF(DUMMY_PDF_CATALOG[0])}
                    className="bg-blue-600 py-3 rounded-2xl flex-row items-center justify-center gap-2 shadow-xs active:scale-98"
                  >
                    <Download size={16} color="#ffffff" />
                    <Text className="text-xs font-bold text-white">Download Term Report Card (PDF)</Text>
                  </TouchableOpacity>
                </View>

                {/* Performance Analytics */}
                <PerformanceComparisonChart
                  data={comparisonChartData}
                />
              </>
            )}
          </View>
        )}

        {/* ================= TAB 4: PROFILE & SETTINGS ================= */}
        {activeTab === 'profile' && (
          <View className="gap-3.5">
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
              <View className="flex-row items-center gap-3.5">
                <View className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
                  <Text className="text-3xl">🏡</Text>
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-lg font-black text-slate-900">Sunita Sharma</Text>
                  <Text className="text-xs text-slate-500">Primary Guardian</Text>
                  <Badge label="Verified Parent" variant="success" />
                </View>
              </View>

              <View className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Primary Phone:</Text>
                  <Text className="text-xs font-bold text-slate-800">+91 98230 44551</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Registered Email:</Text>
                  <Text className="text-xs font-bold text-slate-800">parent.sharma@gmail.com</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Residential Address:</Text>
                  <Text className="text-xs font-bold text-slate-800">C-402, Green Glen Layout, Delhi</Text>
                </View>
              </View>

              {/* Notification Preferences */}
              <View className="gap-2 pt-2 border-t border-slate-100">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Notification Preferences
                </Text>

                <View className="flex-row items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-bold text-slate-800">Daily WhatsApp Digest</Text>
                    <Text className="text-[11px] text-slate-500">Receive evening attendance & homework recap</Text>
                  </View>
                  <Switch
                    value={waDailyDigest}
                    onValueChange={setWaDailyDigest}
                    trackColor={{ false: '#cbd5e1', true: '#2563EB' }}
                  />
                </View>

                <View className="flex-row items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-bold text-slate-800">Fee Reminder SMS</Text>
                    <Text className="text-[11px] text-slate-500">Receive due date reminders 3 days in advance</Text>
                  </View>
                  <Switch
                    value={smsAlerts}
                    onValueChange={setSmsAlerts}
                    trackColor={{ false: '#cbd5e1', true: '#2563EB' }}
                  />
                </View>
              </View>

              {/* Sign Out Button */}
              <TouchableOpacity
                onPress={handleLogout}
                className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex-row items-center justify-center gap-2 active:scale-98 mt-2"
              >
                <LogOut size={16} color="#e11d48" />
                <Text className="text-xs font-bold text-rose-700">Sign Out of Parent Portal</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      {/* ================= MODAL: LINK ANOTHER CHILD ================= */}
      <Modal visible={isLinkChildModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 gap-3.5 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-slate-900">Link Another Child</Text>
              <TouchableOpacity onPress={() => setIsLinkChildModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 14, paddingBottom: 36 }}
            >
              <Text className="text-xs text-slate-500 leading-relaxed">
                Enter your ward's unique Student Link Code (provided by their tuition teacher, e.g. STU-AMELIA-902) or the student's registered mobile number.
              </Text>

              <TextInput
                placeholder="e.g. STU-AMELIA-902 or 9823044551"
                placeholderTextColor="#94a3b8"
                value={childCodeInput}
                onChangeText={setChildCodeInput}
                autoCapitalize="characters"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold"
              />

              <TouchableOpacity
                onPress={handleLinkChild}
                disabled={isLinkingChild}
                className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-1 active:scale-98"
              >
                <Text className="text-xs font-bold text-white">
                  {isLinkingChild ? 'Verifying Student Code...' : 'Verify & Link Child'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modals */}
      {FEATURE_FEES && (
        <>
          <RazorpayCheckoutModal />
          <FeeReceiptModal />
        </>
      )}
      <NotificationDrawer />
    </ScreenWrapper>
  );
}
