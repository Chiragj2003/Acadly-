import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Building2,
  Users,
  LogOut,
  Plus,
  Send,
  GraduationCap,
  Sparkles,
  BookOpen,
  DollarSign,
} from 'lucide-react-native';
import { ScreenWrapper, BottomTabBar, LanguageSwitcher, type TabItem, OnboardingWalkthroughModal } from '@/components/ui';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useJoinRequests } from '@/hooks/queries/useAdmissionQueries';
import { useStudentsRoster } from '@/hooks/queries/useStudentQueries';
import { AdminHeader } from '@/components/screens/admin/AdminHeader';
import { AdminHomeTab } from '@/components/screens/admin/AdminHomeTab';
import { AdminCreateBatchModal } from '@/components/screens/admin/AdminCreateBatchModal';

export default function PinterestAdminScreen() {
  const { isAuthorized, isLoading } = useRoleGuard(['admin']);
  const router = useRouter();
  const { activeInstitute, batches, createBatch, signOut } = useAuth();
  const { coachingProfile } = useUI();
  const { data: joinRequests = [] } = useJoinRequests(activeInstitute?.id);
  const { data: studentsRoster = [] } = useStudentsRoster(activeInstitute?.id);

  const [activeTab, setActiveTab] = useState<'home' | 'batches' | 'admissions_dues' | 'profile'>('home');

  // Create Batch modal state
  const [isCreateBatchModalOpen, setIsCreateBatchModalOpen] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchSubject, setBatchSubject] = useState('');
  const [batchExam, setBatchExam] = useState('');
  const [batchRoom, setBatchRoom] = useState('');
  const [batchTeacher, setBatchTeacher] = useState('');

  const pendingJoinCount = joinRequests.filter((r) => r.status === 'pending').length;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the Institute Admin Console?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth');
        },
      },
    ]);
  };

  const handleCreateBatch = async () => {
    if (!batchName.trim()) {
      Alert.alert('Required', 'Please enter a name for the batch.');
      return;
    }

    try {
      await createBatch({
        name: batchName.trim(),
        subject: batchSubject.trim() || 'General Academics',
        target_exam: batchExam.trim() || 'Board / Entrance',
        room_number: batchRoom.trim() || 'Room 1',
        start_time: '04:30 PM',
        end_time: '06:00 PM',
        assigned_teacher_name: batchTeacher.trim() || 'Assigned Faculty',
        academic_year: '2026-2027',
        status: 'in_progress',
      });

      setIsCreateBatchModalOpen(false);
      setBatchName('');
      setBatchSubject('');
      setBatchExam('');
      setBatchRoom('');
      setBatchTeacher('');
      Alert.alert('Success', `Batch "${batchName}" launched successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create batch';
      Alert.alert('Error', msg);
    }
  };

  const handleWhatsAppFeeBlast = async () => {
    try {
      await Share.share({
        message: `[${activeInstitute?.name || 'Academy'}] Reminder: Monthly tuition fee statements for November 2026 are generated. Please clear dues via the Acadly Parent App to receive automated GST receipts.`,
      });
    } catch {
      // Ignored
    }
  };

  const tabs: TabItem[] = [
    { key: 'home', label: 'Overview', icon: (color, size) => <Sparkles color={color} size={size} /> },
    { key: 'batches', label: 'Batches', icon: (color, size) => <BookOpen color={color} size={size} /> },
    { key: 'admissions_dues', label: 'Dues', icon: (color, size) => <DollarSign color={color} size={size} />, badgeCount: pendingJoinCount },
    { key: 'profile', label: 'Center', icon: (color, size) => <Building2 color={color} size={size} /> },
  ];

  if (isLoading || !isAuthorized) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-xs text-slate-500 font-medium">Authorizing admin console...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View className="px-4 pt-3 pb-1">
        <AdminHeader
          instituteName={activeInstitute?.name || coachingProfile.name}
          instituteCode={activeInstitute?.code || coachingProfile.inviteCode}
          pendingJoinCount={pendingJoinCount}
          onOpenVerify={() => router.push('/verify-students')}
          onOpenCommunity={() => router.push('/community')}
        />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-3.5 px-4 py-3">
        {activeTab === 'home' && (
          <AdminHomeTab
            enrolledStudentsCount={studentsRoster.length}
            activeBatchesCount={batches.length}
            pendingRequestsCount={pendingJoinCount}
            onOpenBatches={() => setActiveTab('batches')}
            onOpenAdmissions={() => router.push('/verify-students')}
            onOpenStudentDirectory={() => router.push('/student-detail')}
          />
        )}

        {activeTab === 'batches' && (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Active Batches ({batches.length})
              </Text>
              <TouchableOpacity
                onPress={() => setIsCreateBatchModalOpen(true)}
                className="bg-purple-600 px-3 py-1.5 rounded-xl flex-row items-center gap-1 active:scale-95"
              >
                <Plus size={14} color="white" />
                <Text className="text-xs font-bold text-white">New Batch</Text>
              </TouchableOpacity>
            </View>

            {batches.map((b) => (
              <View
                key={b.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs gap-1.5"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-slate-900">{b.name}</Text>
                  <View className="bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    <Text className="text-[10px] font-bold text-purple-700">
                      {b.student_count || 0} Students
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-500">
                  {b.subject} • {b.target_exam || 'Board'}
                </Text>
                <Text className="text-[11px] text-slate-400">
                  Room: {b.room_number || 'Hall A'} • Teacher: {b.assigned_teacher_name || 'Faculty'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'admissions_dues' && (
          <View className="gap-3.5">
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Fee Notifications & WhatsApp Dispatch
              </Text>
              <Text className="text-xs text-slate-600 leading-relaxed">
                Dispatch monthly fee invoices and payment links directly to parents' registered WhatsApp numbers.
              </Text>
              <TouchableOpacity
                onPress={handleWhatsAppFeeBlast}
                className="bg-emerald-600 py-3 rounded-2xl flex-row items-center justify-center gap-2 shadow-xs active:scale-98"
              >
                <Send size={15} color="white" />
                <Text className="text-xs font-bold text-white">Broadcast Fee Statements</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/verify-students')}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex-row items-center justify-between"
            >
              <View>
                <Text className="text-sm font-bold text-slate-900">Pending Join Requests</Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Review student admission applications
                </Text>
              </View>
              <View className="bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
                <Text className="text-xs font-bold text-rose-800">{pendingJoinCount} Pending</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'profile' && (
          <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 items-center justify-center">
                <Building2 size={26} color="#7c3aed" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-black text-slate-900">
                  {activeInstitute?.name || coachingProfile.name}
                </Text>
                <Text className="text-xs text-slate-500">
                  {activeInstitute?.city || coachingProfile.city} • Verified Institute
                </Text>
              </View>
            </View>

            <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 gap-2 mt-1">
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-500">Center Code:</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {activeInstitute?.code || coachingProfile.inviteCode}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-500">Director Contact:</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {coachingProfile.phone || '+91 98230 11223'}
                </Text>
              </View>
            </View>

            <LanguageSwitcher className="mt-2" />

            <TouchableOpacity
              onPress={handleLogout}
              className="bg-rose-50 border border-rose-200 py-3 rounded-2xl flex-row items-center justify-center gap-2 active:scale-98 mt-2"
            >
              <LogOut size={16} color="#be123c" />
              <Text className="text-xs font-bold text-rose-700">Sign Out of Admin Console</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AdminCreateBatchModal
        visible={isCreateBatchModalOpen}
        onClose={() => setIsCreateBatchModalOpen(false)}
        batchName={batchName}
        onChangeBatchName={setBatchName}
        batchSubject={batchSubject}
        onChangeBatchSubject={setBatchSubject}
        batchExam={batchExam}
        onChangeBatchExam={setBatchExam}
        batchRoom={batchRoom}
        onChangeBatchRoom={setBatchRoom}
        batchTeacher={batchTeacher}
        onChangeBatchTeacher={setBatchTeacher}
        onCreate={handleCreateBatch}
      />

      <BottomTabBar tabs={tabs} activeTab={activeTab} onTabChange={(t) => setActiveTab(t as typeof activeTab)} />
      <OnboardingWalkthroughModal role="admin" />
    </ScreenWrapper>
  );
}
