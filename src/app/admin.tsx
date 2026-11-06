import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import {
  Users,
  BookOpen,
  CalendarCheck,
  Wallet,
  MessageSquare,
  UserPlus,
  ClipboardCheck,
  PlusSquare,
  IndianRupee,
  Clock,
  Sparkles,
  X,
  Plus,
  BarChart3,
  Home,
  Layers,
  GraduationCap,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Share2,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import { useAcademic } from '@/context/AcademicContext';
import {
  ScreenWrapper,
  MetricCard,
  Badge,
  BottomTabBar,
  type TabItem,
} from '@/components/ui';
import {
  FeeCollectionBarChart,
} from '@/components/charts';
import {
  AdminAnalyticsView,
  FeeReceiptModal,
  NotificationDrawer,
  RazorpayCheckoutModal,
} from '@/components/finance';
import { FEATURE_FEES } from '@/config/features';

export default function PinterestAdminScreen() {
  const { isAuthorized, isLoading } = useRoleGuard(["admin"]);
  const router = useRouter();
  const { activeInstitute, batches, createBatch, signOut } = useAuth();
  const { joinRequests, coachingProfile, studentsRoster } = useAcademic();
  const {
    analytics,
    openNotificationDrawer,
    unreadCount,
    sendNotification,
  } = useFeeNotification();

  // Bottom Navigation Tabs (4 Tabs)
  const [activeTab, setActiveTab] = useState<'home' | 'batches' | 'admissions_dues' | 'profile'>('home');

  // Create Batch Modal State
  const [isCreateBatchModalOpen, setIsCreateBatchModalOpen] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchSubject, setBatchSubject] = useState('');
  const [batchExam, setBatchExam] = useState('');
  const [batchRoom, setBatchRoom] = useState('');
  const [batchTeacher, setBatchTeacher] = useState('');

  const pendingJoinCount = joinRequests.filter((r) => r.status === 'pending').length;

  const handleLogout = () => {
    Alert.alert(
      'Sign Out 🚪',
      'Are you sure you want to sign out from the Admin Command Desk?',
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

  const handleCreateBatch = async () => {
    if (!batchName.trim() || !batchSubject.trim()) {
      Alert.alert('Validation Error', 'Batch Name and Subject are required.');
      return;
    }

    await createBatch({
      name: batchName.trim(),
      subject: batchSubject.trim(),
      target_exam: batchExam || 'JEE / NEET',
      room_number: batchRoom || 'Room 101',
      start_time: '10:00 AM',
      end_time: '12:30 PM',
      status: 'upcoming',
      assigned_teacher_name: batchTeacher || 'Er. Alok Saxena',
    });

    setIsCreateBatchModalOpen(false);
    setBatchName('');
    setBatchSubject('');
    setBatchExam('');
    setBatchRoom('');
    setBatchTeacher('');

    await sendNotification(
      'all',
      'New Batch Scheduled',
      `Batch "${batchName}" launched in ${activeInstitute?.name}. Enrollment is now open.`,
      'broadcast'
    );

    Alert.alert('Batch Created ✅', `Batch "${batchName}" is now active in ${activeInstitute?.name}`);
  };

  const handleWhatsAppFeeBlast = async () => {
    await sendNotification(
      'parent',
      'Fee Overdue Reminders Dispatched',
      `Sent in-app notifications and payment prompts to ${analytics.overdue_students_count} overdue accounts.`,
      'fee'
    );

    Alert.alert(
      'In-App Fee Reminders Dispatched',
      `Instant in-app notice and UPI payment links sent to all ${analytics.overdue_students_count} student & parent dashboards.`
    );
  };

  const tabs: TabItem[] = [
    {
      key: 'home',
      label: 'Home',
      icon: (color, size) => <Home color={color} size={size} />,
      badgeCount: pendingJoinCount > 0 ? pendingJoinCount : undefined,
    },
    {
      key: 'batches',
      label: 'Batches',
      icon: (color, size) => <Layers color={color} size={size} />,
      badgeCount: batches.length,
    },
    {
      key: 'admissions_dues',
      label: FEATURE_FEES ? 'Admissions & Dues' : 'Admissions & Approvals',
      icon: (color, size) => <Users color={color} size={size} />,
      badgeCount: FEATURE_FEES ? analytics.overdue_students_count : pendingJoinCount,
    },
    {
      key: 'profile',
      label: 'Center Profile',
      icon: (color, size) => <ShieldCheck color={color} size={size} />,
    },
  ];

  
  if (isLoading || !isAuthorized) {
    return (
      <ScreenWrapper headerProps={{ title: 'Admin Command' }}>
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
        title: 'Admin Command Desk',
        instituteName: activeInstitute?.name || 'Bloom Science Academy',
        profileInitials: 'AD',
        onNotificationPress: openNotificationDrawer,
        onProfilePress: () => {
          Alert.alert(
            coachingProfile.directorName || 'Director Sharma',
            `${activeInstitute?.name || 'Bloom Science Academy'}\nInvite Code: ${coachingProfile.inviteCode}\nCity: ${coachingProfile.city}`,
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
      contentContainerStyle={{ paddingBottom: 24 }}
      footer={
        <BottomTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as any)}
          accentColor="#2563EB"
        />
      }
    >
      {/* ================= TAB 1: HOME (OVERVIEW) ================= */}
        {activeTab === 'home' && (
          <View className="gap-3.5">
            {/* Institute Master Hero Card */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Institute Headquarters
                  </Text>
                </View>
                <Badge label={coachingProfile.city || 'Kota Central'} variant="neutral" />
              </View>

              <View className="flex-row items-center gap-3.5 mb-3.5">
                <View className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
                  <Text className="text-2xl">🏫</Text>
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
                    {activeInstitute?.name || 'Bloom Academy'}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-0.5">
                    Director: {coachingProfile.directorName || 'Director Sharma'} • {batches.length} Batches
                  </Text>
                  <Text className="text-[11px] font-semibold text-blue-600 mt-0.5">
                    Invite Code: {coachingProfile.inviteCode}
                  </Text>
                </View>
              </View>

              {/* Action Strip: Verify Join & Student 360 */}
              <View className="flex-row gap-2 pt-3 border-t border-slate-100">
                <TouchableOpacity
                  onPress={() => router.push('/verify-students')}
                  className="flex-1 bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95"
                >
                  {pendingJoinCount > 0 && <View className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                  <Text className="text-xs font-bold text-blue-700">
                    Verify Admissions ({pendingJoinCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/student-detail')}
                  className="flex-1 bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95"
                >
                  <Text className="text-xs">🔍</Text>
                  <Text className="text-xs font-bold text-slate-800">Student 360°</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2x2 Metric Cards Grid */}
            <View className="gap-2.5">
              <View className="flex-row gap-2.5">
                <View className="flex-1">
                  <MetricCard
                    title="Enrolled Students"
                    value={analytics.enrolled_students.toString()}
                    trendText="+12% this mo"
                    trendDirection="positive"
                    icon={<Users size={16} color="#2563EB" />}
                  />
                </View>
                <View className="flex-1">
                  <MetricCard
                    title="Active Batches"
                    value={batches.length.toString()}
                    trendText="All Running"
                    trendDirection="info"
                    icon={<BookOpen size={16} color="#2563EB" />}
                  />
                </View>
              </View>

              <View className="flex-row gap-2.5">
                <View className="flex-1">
                  <MetricCard
                    title="Today's Roll Call"
                    value={`${analytics.today_attendance_rate}%`}
                    trendText={`${analytics.present_count} P • ${analytics.absent_count} A`}
                    trendDirection="neutral"
                    icon={<CalendarCheck size={16} color="#059669" />}
                  />
                </View>
                <View className="flex-1">
                  {FEATURE_FEES ? (
                    <MetricCard
                      title="Pending Dues"
                      value={`₹${(analytics.total_pending_dues / 100000).toFixed(2)}L`}
                      trendText={`${analytics.overdue_students_count} Overdue`}
                      trendDirection="negative"
                      icon={<Wallet size={16} color="#e11d48" />}
                    />
                  ) : (
                    <MetricCard
                      title="Pending Approvals"
                      value={pendingJoinCount.toString()}
                      trendText={pendingJoinCount > 0 ? "Review Required" : "All Clear"}
                      trendDirection={pendingJoinCount > 0 ? "negative" : "positive"}
                      icon={<Clock size={16} color="#F59E0B" />}
                    />
                  )}
                </View>
              </View>
            </View>

            {/* WhatsApp Fee Recovery Card (v2) */}
            {FEATURE_FEES && (
              <View className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                  <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center">
                    <MessageSquare size={16} color="#059669" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-800">Fee Cycle Overdue Blast</Text>
                    <Text className="text-[11px] text-slate-500">
                      {analytics.overdue_students_count} parents pending reminders
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleWhatsAppFeeBlast}
                  className="bg-emerald-600 px-3.5 py-2 rounded-xl active:scale-95 shadow-xs"
                >
                  <Text className="text-xs font-bold text-white">Send WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Quick Actions Panel */}
            <View className="gap-2">
              <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
                Admin Controls
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => router.push('/verify-students')}
                  className="flex-1 bg-white border border-slate-200/90 p-3 rounded-2xl items-center gap-1.5 active:scale-98 shadow-xs"
                >
                  <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
                    <UserPlus size={16} color="#2563EB" />
                  </View>
                  <Text className="text-[11px] font-bold text-slate-800 text-center">Admissions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsCreateBatchModalOpen(true)}
                  className="flex-1 bg-white border border-slate-200/90 p-3 rounded-2xl items-center gap-1.5 active:scale-98 shadow-xs"
                >
                  <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center">
                    <PlusSquare size={16} color="#059669" />
                  </View>
                  <Text className="text-[11px] font-bold text-slate-800 text-center">New Batch</Text>
                </TouchableOpacity>

                {FEATURE_FEES ? (
                  <TouchableOpacity
                    onPress={handleWhatsAppFeeBlast}
                    className="flex-1 bg-white border border-slate-200/90 p-3 rounded-2xl items-center gap-1.5 active:scale-98 shadow-xs"
                  >
                    <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center">
                      <IndianRupee size={16} color="#d97706" />
                    </View>
                    <Text className="text-[11px] font-bold text-slate-800 text-center">Fee Blast</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push('/student-detail')}
                    className="flex-1 bg-white border border-slate-200/90 p-3 rounded-2xl items-center gap-1.5 active:scale-98 shadow-xs"
                  >
                    <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center">
                      <Users size={16} color="#d97706" />
                    </View>
                    <Text className="text-[11px] font-bold text-slate-800 text-center">Roster</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => router.push('/community')}
                  className="flex-1 bg-white border border-slate-200/90 p-3 rounded-2xl items-center gap-1.5 active:scale-98 shadow-xs"
                >
                  <View className="w-9 h-9 rounded-xl bg-purple-50 items-center justify-center">
                    <MessageSquare size={16} color="#7c3aed" />
                  </View>
                  <Text className="text-[11px] font-bold text-slate-800 text-center">Forum</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fee Collection Bar Chart (v2) */}
            {FEATURE_FEES && <FeeCollectionBarChart />}
          </View>
        )}

        {/* ================= TAB 2: BATCHES ================= */}
        {activeTab === 'batches' && (
          <View className="gap-3.5">
            <View className="flex-row items-center justify-between px-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-bold text-slate-900">Live Active Batches</Text>
                <Badge label={`${batches.length} Active`} variant="info" />
              </View>
              <TouchableOpacity
                onPress={() => setIsCreateBatchModalOpen(true)}
                className="bg-blue-600 px-3 py-1.5 rounded-xl flex-row items-center gap-1 active:scale-95 shadow-xs"
              >
                <Plus size={13} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Create Batch</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              {batches.map((batch) => (
                <View
                  key={batch.id}
                  className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs gap-3"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-2">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <Badge
                          label={batch.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                          variant={batch.status === 'in_progress' ? 'active' : 'info'}
                          showDot={batch.status === 'in_progress'}
                        />
                        <Badge label={batch.room_number || 'Room 101'} variant="neutral" />
                      </View>
                      <Text className="text-base font-extrabold text-slate-900">{batch.name}</Text>
                      <Text className="text-xs text-slate-500 mt-0.5">
                        {batch.subject} • Faculty: {batch.assigned_teacher_name}
                      </Text>
                    </View>

                    <Badge
                      label={`${batch.present_count || batch.student_count || 45} Pupils`}
                      variant="success"
                    />
                  </View>

                  <View className="flex-row items-center justify-between pt-2 border-t border-slate-100">
                    <View className="flex-row items-center gap-1.5">
                      <Clock size={13} color="#64748B" />
                      <Text className="text-xs text-slate-500 font-medium">
                        {batch.start_time} - {batch.end_time}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push('/verify-students')}
                      className="flex-row items-center gap-1"
                    >
                      <Text className="text-xs font-bold text-blue-600">Roster & Vitals</Text>
                      <ChevronRight size={13} color="#2563EB" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ================= TAB 3: ADMISSIONS & DUES / APPROVALS ================= */}
        {activeTab === 'admissions_dues' && (
          <View className="gap-3.5">
            {/* Admissions Queue */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <UserPlus size={16} color="#2563EB" />
                  <Text className="text-sm font-bold text-slate-900">Admissions Queue</Text>
                </View>
                <Badge label={`${pendingJoinCount} Pending`} variant="warning" />
              </View>

              <Text className="text-xs text-slate-600">
                {FEATURE_FEES
                  ? 'Review verified student applications, approve classroom access, and assign fee plans.'
                  : 'Review student applications, verify credentials, and approve classroom admission.'}
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/verify-students')}
                className="bg-blue-600 py-2.5 rounded-xl items-center shadow-xs active:scale-98"
              >
                <Text className="text-xs font-bold text-white">Open Verification Desk →</Text>
              </TouchableOpacity>
            </View>

            {FEATURE_FEES ? (
              /* Overdue Accounts & Direct Action (v2) */
              <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Wallet size={16} color="#e11d48" />
                    <Text className="text-sm font-bold text-slate-900">Overdue Tuition Accounts</Text>
                  </View>
                  <Badge label="34 Accounts" variant="negative" />
                </View>

                <View className="gap-2">
                  {studentsRoster.slice(0, 3).map((st) => (
                    <TouchableOpacity
                      key={st.id}
                      onPress={() => router.push({ pathname: '/student-detail', params: { studentId: st.id } })}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex-row items-center justify-between active:scale-98"
                    >
                      <View className="flex-1 pr-2">
                        <Text className="text-xs font-bold text-slate-800">{st.name}</Text>
                        <Text className="text-[11px] text-slate-500">{st.batchName}</Text>
                        <Text className="text-[10px] text-rose-700 font-semibold mt-0.5">
                          Due: ₹15,000 • Guardian: {st.guardianName}
                        </Text>
                      </View>
                      <View className="bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                        <Text className="text-[10px] font-bold text-rose-700">Overdue</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleWhatsAppFeeBlast}
                  className="bg-emerald-600 py-3 rounded-2xl items-center flex-row justify-center gap-2 active:scale-98 shadow-xs mt-1"
                >
                  <MessageSquare size={14} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Dispatch Automated WhatsApp Nudges</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Enrolled Students Roster Overview */
              <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Users size={16} color="#2563EB" />
                    <Text className="text-sm font-bold text-slate-900">Enrolled Student Directory</Text>
                  </View>
                  <Badge label={`${studentsRoster.length} Active`} variant="success" />
                </View>

                <View className="gap-2">
                  {studentsRoster.slice(0, 4).map((st) => (
                    <TouchableOpacity
                      key={st.id}
                      onPress={() => router.push({ pathname: '/student-detail', params: { studentId: st.id } })}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex-row items-center justify-between active:scale-98"
                    >
                      <View className="flex-1 pr-2">
                        <Text className="text-xs font-bold text-slate-800">{st.name}</Text>
                        <Text className="text-[11px] text-slate-500">{st.batchName}</Text>
                        <Text className="text-[10px] text-blue-600 font-semibold mt-0.5">
                          Roll: {st.rollNumber} • Guardian: {st.guardianName}
                        </Text>
                      </View>
                      <View className="bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                        <Text className="text-[10px] font-bold text-blue-700">Inspect 360°</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => router.push('/student-detail')}
                  className="bg-slate-100 py-2.5 rounded-xl items-center active:scale-98 mt-1"
                >
                  <Text className="text-xs font-bold text-slate-700">View Full Student Directory →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ================= TAB 4: CENTER PROFILE ================= */}
        {activeTab === 'profile' && (
          <View className="gap-3.5">
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
              <View className="flex-row items-center gap-3.5">
                <View className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
                  <Text className="text-3xl">🏫</Text>
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-lg font-black text-slate-900">{activeInstitute?.name || 'Bloom Academy'}</Text>
                  <Text className="text-xs text-slate-500">{coachingProfile.city || 'Kota, Rajasthan'}</Text>
                  <Badge label="Institute Admin" variant="info" />
                </View>
              </View>

              <View className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Center Invite Code:</Text>
                  <Text className="text-xs font-mono font-bold text-blue-600">{coachingProfile.inviteCode}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Director In-Charge:</Text>
                  <Text className="text-xs font-bold text-slate-800">{coachingProfile.directorName}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Official Contact:</Text>
                  <Text className="text-xs font-bold text-slate-800">{coachingProfile.phone}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Programs Offered:</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {coachingProfile.subjectsOffered.join(', ')}
                  </Text>
                </View>
              </View>

              {/* Analytics Summary */}
              <AdminAnalyticsView />

              {/* Sign Out Button */}
              <TouchableOpacity
                onPress={handleLogout}
                className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex-row items-center justify-center gap-2 active:scale-98 mt-2"
              >
                <LogOut size={16} color="#e11d48" />
                <Text className="text-xs font-bold text-rose-700">Sign Out of Admin Desk</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      {/* ================= CREATE BATCH MODAL ================= */}
      <Modal visible={isCreateBatchModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-slate-900">Create New Academic Batch</Text>
              <TouchableOpacity onPress={() => setIsCreateBatchModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
            >
              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Batch Title</Text>
                <TextInput
                  placeholder="e.g. JEE Target 2026 Batch Alpha"
                  placeholderTextColor="#94a3b8"
                  value={batchName}
                  onChangeText={setBatchName}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
                />
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-[11px] font-bold text-slate-700 mb-1">Subject Domain</Text>
                  <TextInput
                    placeholder="Physics / Mathematics"
                    placeholderTextColor="#94a3b8"
                    value={batchSubject}
                    onChangeText={setBatchSubject}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] font-bold text-slate-700 mb-1">Target Exam</Text>
                  <TextInput
                    placeholder="JEE Advanced"
                    placeholderTextColor="#94a3b8"
                    value={batchExam}
                    onChangeText={setBatchExam}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                  />
                </View>
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-[11px] font-bold text-slate-700 mb-1">Classroom / Room No.</Text>
                  <TextInput
                    placeholder="Room 204 or Hall A"
                    placeholderTextColor="#94a3b8"
                    value={batchRoom}
                    onChangeText={setBatchRoom}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] font-bold text-slate-700 mb-1">Lead Teacher</Text>
                  <TextInput
                    placeholder="Er. Alok Saxena"
                    placeholderTextColor="#94a3b8"
                    value={batchTeacher}
                    onChangeText={setBatchTeacher}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleCreateBatch}
                className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-1 active:scale-98"
              >
                <Text className="text-xs font-bold text-white">Save & Launch Batch 🚀</Text>
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
