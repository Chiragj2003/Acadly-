import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Home, Layers, Inbox, Building2, Plus, ChevronRight, LogOut, Send, MessageCircle, Share2 } from 'lucide-react-native';
import {
  ScreenWrapper,
  BottomTabBar,
  LanguageSwitcher,
  type TabItem,
  OnboardingWalkthroughModal,
  Card,
  Chip,
  CountPill,
  DisplayTitle,
  Eyebrow,
  ListRow,
  ListEmptyState,
  Mascot,
  StatTile,
} from '@/components/ui';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { useJoinRequests } from '@/hooks/queries/useAdmissionQueries';
import { useStudentCount } from '@/hooks/queries/useStudentQueries';
import { useBatches, useCreateBatch } from '@/hooks/queries/useBatchQueries';
import { AdminCreateBatchModal } from '@/components/screens/admin/AdminCreateBatchModal';
import { FEATURE_FEES } from '@/config/features';
import { confirmAction } from '@/lib/confirm';

type AdminTab = 'home' | 'batches' | 'requests' | 'profile';

export default function AdminScreen() {
  const { isAuthorized, isLoading } = useRoleGuard(['admin']);
  const router = useRouter();
  const { activeInstitute, signOut } = useAuth();
  const instituteId = activeInstitute?.id;

  // Real data only: batches and counts come from the database (previously the
  // list came from in-memory AuthContext state and the student count was the
  // length of one 30-row roster page).
  const { data: batches = [] } = useBatches(instituteId);
  const { data: studentCount = 0 } = useStudentCount(instituteId);
  const { data: joinRequests = [] } = useJoinRequests(instituteId);
  const createBatchMutation = useCreateBatch();

  const [activeTab, setActiveTab] = useState<AdminTab>('home');
  const [isCreateBatchModalOpen, setIsCreateBatchModalOpen] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchSubject, setBatchSubject] = useState('');
  const [batchExam, setBatchExam] = useState('');
  const [batchRoom, setBatchRoom] = useState('');

  const pendingJoinCount = joinRequests.filter((r) => r.status === 'pending').length;
  const liveBatches = batches.filter((b) => b.status !== 'archived' && !b.is_archived);

  const handleLogout = () =>
    confirmAction('Sign out', 'Sign out of Acadly on this device?', 'Sign out', async () => {
      await signOut();
      router.replace('/auth');
    });

  // Saves to the database. The old handler only added the batch to local state
  // (it vanished on reload) and filled blanks with invented subject/room/time.
  const handleCreateBatch = async () => {
    if (!batchName.trim()) {
      Alert.alert('Name needed', 'Give the batch a name.');
      return;
    }
    if (!instituteId) {
      Alert.alert('Not ready', 'Select an institute first.');
      return;
    }
    try {
      await createBatchMutation.mutateAsync({
        institute_id: instituteId,
        name: batchName.trim(),
        subject: batchSubject.trim(),
        target_exam: batchExam.trim(),
        room_number: batchRoom.trim(),
        start_time: '',
        end_time: '',
        status: 'in_progress',
      });
      setIsCreateBatchModalOpen(false);
      setBatchName('');
      setBatchSubject('');
      setBatchExam('');
      setBatchRoom('');
      Alert.alert('Batch created', `"${batchName.trim()}" is ready. Share a join code so students can request to join.`);
    } catch (err: unknown) {
      Alert.alert('Could not create batch', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleShareCode = () => {
    const code = activeInstitute?.code || activeInstitute?.join_code;
    if (!code) {
      Alert.alert('No code yet', 'This institute does not have a join code yet.');
      return;
    }
    Share.share({ message: `Join ${activeInstitute?.name ?? 'our institute'} on Acadly with code ${code}` }).catch(() => null);
  };

  const handleWhatsAppFeeBlast = async () => {
    try {
      await Share.share({
        message: `[${activeInstitute?.name || 'Institute'}] Reminder: this month's fee statements are ready in the Acadly parent app.`,
      });
    } catch {
      // Share sheet dismissed
    }
  };

  const tabs: TabItem[] = [
    { key: 'home', label: 'Overview', icon: (color, size) => <Home color={color} size={size} /> },
    { key: 'batches', label: 'Batches', icon: (color, size) => <Layers color={color} size={size} /> },
    { key: 'requests', label: 'Requests', icon: (color, size) => <Inbox color={color} size={size} />, badgeCount: pendingJoinCount },
    { key: 'profile', label: 'Institute', icon: (color, size) => <Building2 color={color} size={size} /> },
  ];

  if (isLoading || !isAuthorized) {
    return (
      <ScreenWrapper scrollable={false}>
        <View className="flex-1 items-center justify-center p-8 gap-4">
          <Mascot mood="sleepy" size="lg" />
          <Text className="text-sm text-muted font-sans">Checking access…</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const instituteInitial = (activeInstitute?.name || 'A').charAt(0).toUpperCase();

  return (
    <ScreenWrapper
      contentContainerClassName="gap-5 px-5 pt-4"
      footer={
        <BottomTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as AdminTab)}
          trailingAction={{
            label: 'Messages',
            icon: (color, size) => <MessageCircle color={color} size={size} fill={color} />,
            onPress: () => router.push('/chat'),
          }}
        />
      }
    >
      {/* Institute row */}
      <View className="flex-row items-center gap-3">
        <View className="w-11 h-11 rounded-2xl bg-ink items-center justify-center">
          <Text className="font-serif text-white text-[22px]">{instituteInitial}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text className="font-sans-bold text-ink text-[15px]" numberOfLines={1}>
            {activeInstitute?.name || 'Your institute'}
          </Text>
          {activeInstitute?.city ? <Text className="font-sans text-muted text-xs">{activeInstitute.city}</Text> : null}
        </View>
      </View>

      {activeTab === 'home' && (
        <>
          <DisplayTitle>
            {studentCount} {studentCount === 1 ? 'student' : 'students'} across{'\n'}
            {liveBatches.length} {liveBatches.length === 1 ? 'batch' : 'batches'}.
          </DisplayTitle>

          <View className="flex-row gap-2.5">
            <StatTile value={String(studentCount)} label="Students" />
            <StatTile value={String(liveBatches.length)} label="Batches" />
            <StatTile value={String(pendingJoinCount)} label="Requests" />
          </View>

          {pendingJoinCount > 0 ? (
            <Card elevation="hero" tone="mint" onPress={() => router.push('/verify-students')}>
              <Chip label="Needs you" tone="mint" />
              <Text className="font-display text-ink text-[23px] leading-[27px] mt-3">
                {pendingJoinCount} join {pendingJoinCount === 1 ? 'request is' : 'requests are'} waiting
              </Text>
              <View className="flex-row justify-end mt-3">
                <View className="h-11 px-5 rounded-full bg-ink items-center justify-center">
                  <Text className="font-sans-bold text-white text-[15px]">Review</Text>
                </View>
              </View>
            </Card>
          ) : (
            <Card elevation="hero" tone="mint" onPress={handleShareCode}>
              <Chip label="All caught up" tone="mint" />
              <Text className="font-display text-ink text-[23px] leading-[27px] mt-3">
                No requests waiting. Share your join code to grow your batches.
              </Text>
            </Card>
          )}

          {liveBatches.length > 0 && (
            <View className="bg-white rounded-3xl px-4 py-1">
              {liveBatches.slice(0, 4).map((b, i, arr) => (
                <ListRow
                  key={b.id}
                  title={b.name}
                  subtitle={[b.subject, b.room_number].filter(Boolean).join(' · ') || undefined}
                  trailing={<Text className="font-serif text-ink text-lg">{b.student_count}</Text>}
                  onPress={() => setActiveTab('batches')}
                  last={i === arr.length - 1}
                />
              ))}
            </View>
          )}
        </>
      )}

      {activeTab === 'batches' && (
        <>
          <View className="flex-row items-center justify-between">
            <DisplayTitle>Batches</DisplayTitle>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsCreateBatchModalOpen(true)}
              className="h-12 pl-4 pr-5 rounded-full bg-ink flex-row items-center gap-1.5 active:opacity-90"
            >
              <Plus size={18} color="#FFFFFF" />
              <Text className="font-sans-bold text-white text-[15px]">New</Text>
            </Pressable>
          </View>

          {batches.length === 0 ? (
            <ListEmptyState
              title="No batches yet"
              message="Create your first batch, then share its join code with students."
              actionLabel="Create a batch"
              onAction={() => setIsCreateBatchModalOpen(true)}
            />
          ) : (
            batches.map((b, i) => (
              <Card key={b.id} elevation={i === 0 ? 'hero' : 'lowest'} tone="sky" className="gap-1">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-display text-ink text-[19px]">{b.name}</Text>
                    <Text className="font-sans text-slate-700 text-[13px]">
                      {[b.subject, b.target_exam, b.room_number, b.assigned_teacher_name].filter(Boolean).join(' · ') ||
                        'No details added yet'}
                    </Text>
                  </View>
                  <Text className="font-serif text-ink text-[28px] leading-[30px]">{b.student_count}</Text>
                </View>
              </Card>
            ))
          )}
        </>
      )}

      {activeTab === 'requests' && (
        <>
          <DisplayTitle>Requests</DisplayTitle>
          <View className="bg-white rounded-3xl px-4 py-1">
            <ListRow
              title="Join requests"
              subtitle="Approve, waitlist or reject students"
              leading={<CountPill count={pendingJoinCount} tone="butter" />}
              trailing={<ChevronRight size={18} color="#8C877E" />}
              onPress={() => router.push('/verify-students')}
            />
            <ListRow
              title="Class doubts"
              subtitle="See what students are asking"
              trailing={<ChevronRight size={18} color="#8C877E" />}
              onPress={() => router.push('/community')}
              last
            />
          </View>

          {FEATURE_FEES && (
            <Card elevation="lowest" className="gap-3">
              <Text className="font-display text-ink text-lg">Fee reminders</Text>
              <Text className="font-sans text-slate-600 text-sm">Send this month's fee reminder to parents.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={handleWhatsAppFeeBlast}
                className="bg-ink min-h-[48px] rounded-full flex-row items-center justify-center gap-2 active:opacity-90"
              >
                <Send size={16} color="white" />
                <Text className="font-sans-bold text-white text-[15px]">Send reminder</Text>
              </Pressable>
            </Card>
          )}
        </>
      )}

      {activeTab === 'profile' && (
        <>
          <DisplayTitle>Institute</DisplayTitle>
          <View className="bg-white rounded-3xl px-4 py-1">
            <ListRow title={activeInstitute?.name || 'Your institute'} subtitle={activeInstitute?.city || undefined} />
            <ListRow
              title="Join code"
              subtitle={activeInstitute?.code || activeInstitute?.join_code || 'Not set yet'}
              trailing={<Share2 size={18} color="#1C1C1E" />}
              onPress={handleShareCode}
              last
            />
          </View>
          <Eyebrow>Language</Eyebrow>
          <LanguageSwitcher />
          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            className="self-center min-h-[44px] flex-row items-center gap-2 px-4"
          >
            <LogOut size={16} color="#B42318" />
            <Text className="font-sans-bold text-rose-700 text-[15px]">Sign out</Text>
          </Pressable>
        </>
      )}

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
        isSaving={createBatchMutation.isPending}
        onCreate={handleCreateBatch}
      />

      <OnboardingWalkthroughModal role="admin" />
    </ScreenWrapper>
  );
}
