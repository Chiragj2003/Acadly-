import React, { useState } from 'react';
import { View, Text, Pressable, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { FeeCollectionBarChart } from '@/components/charts';
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
  LayoutDashboard,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import { useAcademic } from '@/context/AcademicContext';
import {
  ScreenWrapper,
  MetricCard,
  Button,
  Input,
  Badge,
  Card,
} from '@/components/ui';
import {
  RazorpayCheckoutModal,
  FeeReceiptModal,
  NotificationDrawer,
  AdminAnalyticsView,
} from '@/components/finance';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { activeInstitute, batches, createBatch, signOut } = useAuth();
  const { joinRequests, coachingProfile } = useAcademic();
  const pendingJoinCount = joinRequests.filter(r => r.status === 'pending').length;
  const {
    analytics,
    openNotificationDrawer,
    unreadCount,
    sendNotification,
  } = useFeeNotification();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');

  // Create Batch Modal State
  const [isCreateBatchModalOpen, setIsCreateBatchModalOpen] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchSubject, setBatchSubject] = useState('');
  const [batchExam, setBatchExam] = useState('');
  const [batchRoom, setBatchRoom] = useState('');
  const [batchTeacher, setBatchTeacher] = useState('');

  const handleCreateBatch = async () => {
    if (!batchName || !batchSubject) {
      Alert.alert('Validation Error', 'Batch Name and Subject are required.');
      return;
    }

    await createBatch({
      name: batchName,
      subject: batchSubject,
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

    Alert.alert('Batch Created', `Batch "${batchName}" is now active in ${activeInstitute?.name}`);
  };

  const handleWhatsAppNudge = async () => {
    await sendNotification(
      'parent',
      'Fee Cycle Reminder Dispatched',
      'Queued WhatsApp templates for 34 overdue accounts via WhatsApp Business API.',
      'fee'
    );
    Alert.alert(
      'WhatsApp Fee Automation',
      'Dispatched 34 fee overdue reminder templates to registered parents via WhatsApp Business API.'
    );
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Admin Dashboard',
        instituteName: activeInstitute?.name,
        onNotificationPress: openNotificationDrawer,
        onProfilePress: () => {
          Alert.alert(
            'Director Sharma 🌸',
            'Apex Kota Super-Admin & Center Lead',
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
      {/* Greeting Banner with Live Accent (Cute & Friendly) */}
      <View className="bg-cute-peach-light border-2 border-cute-peach rounded-[28px] p-5 shadow-xs mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <View className="bg-white px-2.5 py-0.5 rounded-full border border-cute-peach flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-emerald-500" />
            <Text className="text-[10px] font-bold text-cute-peach uppercase">Command Desk</Text>
          </View>
          <Text className="text-xs font-semibold text-cute-muted">
            {activeInstitute?.name || 'Bloom Academy 🌸'}
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="w-13 h-13 rounded-2xl bg-white border border-cute-border items-center justify-center shadow-xs">
            <Text className="text-3xl">🏫</Text>
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-lg font-black text-cute-cocoa" numberOfLines={1}>
              Director Sharma 🌸
            </Text>
            <Text className="text-xs text-cute-muted mt-0.5" numberOfLines={1}>
              {batches.length} Active Batches • 842 Enrolled Students
            </Text>
          </View>
        </View>

        {/* Admin Action Strip */}
        <View className="flex-row gap-2 mt-4 pt-3 border-t border-cute-peach/20">
          <TouchableOpacity
            onPress={() => router.push('/verify-students')}
            className="flex-1 bg-white border border-cute-peach p-2 rounded-xl flex-row items-center justify-center gap-1.5 shadow-xs"
          >
            {pendingJoinCount > 0 && <View className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
            <Text className="text-[11px] font-bold text-cute-peach">Verify Join ({pendingJoinCount})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/student-detail')}
            className="flex-1 bg-white border border-cute-border p-2 rounded-xl flex-row items-center justify-center gap-1.5 shadow-xs"
          >
            <Text className="text-xs">🔍</Text>
            <Text className="text-[11px] font-bold text-cute-cocoa">Student 360°</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Admin Sub-Tabs (Cute Pills) */}
      <View className="flex-row items-center gap-2 mb-3">
        <Pressable
          onPress={() => setActiveTab('dashboard')}
          className={`flex-1 py-2.5 rounded-2xl items-center border ${
            activeTab === 'dashboard'
              ? 'bg-cute-peach border-cute-cocoa/20 shadow-xs'
              : 'bg-white border-cute-border'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'dashboard' ? 'text-white' : 'text-cute-muted'
            }`}
          >
            Academy Overview 📊
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('analytics')}
          className={`flex-1 py-2.5 rounded-2xl items-center border ${
            activeTab === 'analytics'
              ? 'bg-cute-peach border-cute-cocoa/20 shadow-xs'
              : 'bg-white border-cute-border'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'analytics' ? 'text-white' : 'text-cute-muted'
            }`}
          >
            Revenue & Growth 📈
          </Text>
        </Pressable>
      </View>

      {/* TAB 1: COMMAND DASHBOARD */}
      {activeTab === 'dashboard' && (
        <View className="gap-4">
          {/* 2x2 Metric Cards Grid */}
          <View className="gap-2.5">
            <View className="flex-row gap-2.5">
              <View className="flex-1">
                <MetricCard
                  title="Enrolled Students"
                  value={analytics.enrolled_students.toString()}
                  trendText="+12% this mo"
                  trendDirection="positive"
                  icon={<Users size={16} color="#0051d5" />}
                />
              </View>
              <View className="flex-1">
                <MetricCard
                  title="Active Batches"
                  value={batches.length.toString()}
                  trendText="All Running"
                  trendDirection="info"
                  icon={<BookOpen size={16} color="#0051d5" />}
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
                  icon={<CalendarCheck size={16} color="#0051d5" />}
                />
              </View>
              <View className="flex-1">
                <MetricCard
                  title="Pending Dues"
                  value={`₹${(analytics.total_pending_dues / 100000).toFixed(2)}L`}
                  trendText={`${analytics.overdue_students_count} Students`}
                  trendDirection="negative"
                  icon={<Wallet size={16} color="#ba1a1a" />}
                />
              </View>
            </View>

            {/* WhatsApp Nudge Action Bar */}
            <Card elevation="container" className="p-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 flex-1 min-w-0 mr-2">
                <View className="w-8 h-8 rounded-full bg-on-tertiary-container/10 items-center justify-center shrink-0">
                  <MessageSquare size={16} color="#069669" />
                </View>
                <View className="flex-col min-w-0 flex-1">
                  <Text className="text-xs font-bold text-on-surface" numberOfLines={1}>
                    Batch Fee Cycle Overdue
                  </Text>
                  <Text className="text-[11px] text-on-surface-variant" numberOfLines={1}>
                    {analytics.overdue_students_count} parents pending reminders
                  </Text>
                </View>
              </View>

              <Button
                size="sm"
                variant="primary"
                title="Send WhatsApp"
                onPress={handleWhatsAppNudge}
              />
            </Card>
          </View>

          {/* Quick Admin Actions Panel */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Quick Admin Actions
              </Text>
              <Text className="text-xs font-semibold text-secondary">ERP Controls</Text>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => Alert.alert('New Admission', 'Opening student enrollment form...')}
                className="flex-1 bg-surface-container-lowest p-3 rounded-2xl items-center gap-1.5 shadow-sm active:bg-surface-container-high"
              >
                <View className="w-10 h-10 rounded-full bg-secondary/10 items-center justify-center">
                  <UserPlus size={18} color="#0051d5" />
                </View>
                <Text className="text-[11px] font-semibold text-on-surface text-center">New Admission</Text>
              </Pressable>

              <Pressable
                onPress={() => Alert.alert('Roll Call', 'Opening daily faculty roll call tracker...')}
                className="flex-1 bg-surface-container-lowest p-3 rounded-2xl items-center gap-1.5 shadow-sm active:bg-surface-container-high"
              >
                <View className="w-10 h-10 rounded-full bg-on-tertiary-container/10 items-center justify-center">
                  <ClipboardCheck size={18} color="#069669" />
                </View>
                <Text className="text-[11px] font-semibold text-on-surface text-center">Mark Roll</Text>
              </Pressable>

              <Pressable
                onPress={() => setIsCreateBatchModalOpen(true)}
                className="flex-1 bg-surface-container-lowest p-3 rounded-2xl items-center gap-1.5 shadow-sm active:bg-surface-container-high"
              >
                <View className="w-10 h-10 rounded-full bg-surface-container-highest items-center justify-center">
                  <PlusSquare size={18} color="#0051d5" />
                </View>
                <Text className="text-[11px] font-semibold text-on-surface text-center">Create Batch</Text>
              </Pressable>

              <Pressable
                onPress={() => Alert.alert('Fee Collection', 'Opening UPI / Cash fee POS...')}
                className="flex-1 bg-surface-container-lowest p-3 rounded-2xl items-center gap-1.5 shadow-sm active:bg-surface-container-high"
              >
                <View className="w-10 h-10 rounded-full bg-primary-container items-center justify-center">
                  <IndianRupee size={18} color="#ffffff" />
                </View>
                <Text className="text-[11px] font-semibold text-on-surface text-center">Collect Fee</Text>
              </Pressable>
            </View>
          </View>

          {/* Live Active Batches Status */}
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between px-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-bold text-on-surface">Live Classrooms</Text>
                <Badge label={`${batches.length} Active`} variant="info" />
              </View>
              <Pressable
                onPress={() => setIsCreateBatchModalOpen(true)}
                className="flex-row items-center gap-0.5"
              >
                <Plus size={14} color="#0051d5" />
                <Text className="text-xs font-semibold text-secondary">Add Batch</Text>
              </Pressable>
            </View>

            {batches.map((batch) => (
              <Card key={batch.id} elevation="lowest" className="gap-2.5">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <Badge
                        label={batch.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                        variant={batch.status === 'in_progress' ? 'active' : 'info'}
                        showDot={batch.status === 'in_progress'}
                      />
                      <Badge label={batch.room_number || 'Room 101'} variant="neutral" />
                    </View>
                    <Text className="text-base font-bold text-on-surface" numberOfLines={1}>
                      {batch.name}
                    </Text>
                    <Text className="text-xs text-on-surface-variant mt-0.5" numberOfLines={1}>
                      {batch.subject} • {batch.assigned_teacher_name}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-2 border-t border-black/5">
                  <View className="flex-row items-center gap-1.5">
                    <Clock size={14} color="#76777d" />
                    <Text className="text-xs text-on-surface-variant font-medium">
                      {batch.start_time} - {batch.end_time}
                    </Text>
                  </View>

                  <Badge
                    label={`${batch.present_count || batch.student_count || 45} Present`}
                    variant="success"
                  />
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* TAB 2: ANALYTICS & REPORTS */}
      {activeTab === 'analytics' && (
        <View className="gap-4">
          <FeeCollectionBarChart />
          <AdminAnalyticsView />
        </View>
      )}

      {/* CREATE BATCH MODAL */}
      <Modal visible={isCreateBatchModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-5 gap-3 max-h-[85%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-on-surface">Create New Batch</Text>
              <Pressable onPress={() => setIsCreateBatchModalOpen(false)}>
                <X size={20} color="#0b1c30" />
              </Pressable>
            </View>

            <Input
              label="Batch Name"
              placeholder="e.g. JEE Target 2026 Batch Alpha"
              value={batchName}
              onChangeText={setBatchName}
            />

            <Input
              label="Subject / Domain"
              placeholder="e.g. Physics / Mathematics"
              value={batchSubject}
              onChangeText={setBatchSubject}
            />

            <Input
              label="Target Exam"
              placeholder="e.g. JEE Advanced / NEET UG"
              value={batchExam}
              onChangeText={setBatchExam}
            />

            <Input
              label="Room / Hall Number"
              placeholder="e.g. Room 204 or Lab 1"
              value={batchRoom}
              onChangeText={setBatchRoom}
            />

            <Input
              label="Assigned Faculty Name"
              placeholder="e.g. Er. Rakesh Verma"
              value={batchTeacher}
              onChangeText={setBatchTeacher}
            />

            <Button
              variant="primary"
              title="Save & Launch Batch"
              fullWidth
              onPress={handleCreateBatch}
            />
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <RazorpayCheckoutModal />
      <FeeReceiptModal />
      <NotificationDrawer />
    </ScreenWrapper>
  );
}
