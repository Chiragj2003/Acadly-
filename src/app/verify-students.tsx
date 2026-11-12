import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {
  UserCheck,
  Check,
  X,
  HeartHandshake,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Mascot } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import {
  useJoinRequests,
  useApproveJoinRequest,
  useRejectJoinRequest,
} from '@/hooks/queries/useAdmissionQueries';
import { useBatches } from '@/hooks/queries/useBatchQueries';
import { JoinRequestRow } from '@/services/admissionService';

export default function VerifyStudentsScreen() {
  const router = useRouter();
  const { isAuthorized, isLoading: isGuardLoading } = useRoleGuard(['teacher', 'admin']);
  const { user, activeInstitute } = useAuth();
  const { teacherProfile } = useUI();

  // Queries
  const {
    data: requests = [],
    isLoading: isRequestsLoading,
    isError: isRequestsError,
    error: requestsError,
    refetch: refetchRequests,
  } = useJoinRequests(activeInstitute?.id);

  const {
    data: batches = [],
    isLoading: isBatchesLoading,
  } = useBatches(activeInstitute?.id);

  // Mutations
  const approveMutation = useApproveJoinRequest();
  const rejectMutation = useRejectJoinRequest();

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<JoinRequestRow | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedFeePlan, setSelectedFeePlan] = useState<string>('Standard Monthly (₹3,500/mo)');
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('Seat capacity reached for current intake');

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  if (isGuardLoading || !isAuthorized) {
    return (
      <ScreenWrapper headerProps={{ title: 'Verification Desk', onBackPress: () => router.back() }}>
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="small" color="#2563EB" />
          <Text className="text-xs text-slate-500 mt-2 font-medium">Verifying credentials...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const openApprovalModal = (req: JoinRequestRow) => {
    setSelectedRequest(req);
    if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].id);
    }
    setModalVisible(true);
  };

  const openRejectModal = (req: JoinRequestRow) => {
    setSelectedRequest(req);
    setRejectReason('Seat capacity reached for current intake');
    setRejectModalVisible(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest || !user) return;

    const targetBatchId = selectedBatchId || batches[0]?.id;
    if (!targetBatchId) {
      Alert.alert('Selection Error', 'Please create or select an active batch first.');
      return;
    }

    try {
      await approveMutation.mutateAsync({
        requestId: selectedRequest.id,
        batchId: targetBatchId,
        feePlan: selectedFeePlan,
        reviewerId: user.id,
      });

      const assignedBatchName = batches.find((b) => b.id === targetBatchId)?.name || 'Classroom Batch';
      setModalVisible(false);
      Alert.alert(
        'Student Verified & Enrolled',
        `${selectedRequest.student_details?.fullName || 'Student'} has been admitted to ${assignedBatchName}.`
      );
      setSelectedRequest(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      Alert.alert('Admission Error', msg);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest || !user) return;

    try {
      await rejectMutation.mutateAsync({
        requestId: selectedRequest.id,
        reason: rejectReason.trim(),
        reviewerId: user.id,
      });
      setRejectModalVisible(false);
      Alert.alert('Request Declined', 'Student admission has been marked rejected.');
      setSelectedRequest(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      Alert.alert('Error', msg);
    }
  };

  const dynamicFeePlans = [
    'Standard Monthly (₹3,500/mo)',
    'Quarterly Saver (₹9,500/qtr)',
    'Scholarship Tier (Exempt)',
  ];

  return (
    <ScreenWrapper
      scrollable={false}
      headerProps={{
        title: 'Student Verification Queue',
        onBackPress: () => router.back(),
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 pb-16">
        {/* Header Banner */}
        <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
                <UserCheck size={18} color="#2563EB" />
              </View>
              <View>
                <Text className="text-base font-black text-slate-800">Pending Admissions</Text>
                <Text className="text-xs text-slate-500">
                  Institute Code: <Text className="font-bold text-blue-600">{activeInstitute?.center_code || activeInstitute?.invite_code || teacherProfile.teacherCode}</Text>
                </Text>
              </View>
            </View>

            <View className="bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
              <Text className="text-xs font-black text-rose-800">
                {pendingRequests.length} Pending
              </Text>
            </View>
          </View>
          <Text className="text-xs text-slate-500 leading-relaxed">
            Review applicant profiles, select their classroom study batch, and approve admission to grant live classroom access.
          </Text>
        </View>

        {/* Loading Skeleton */}
        {isRequestsLoading && (
          <View className="bg-white border border-slate-200 rounded-3xl p-8 items-center shadow-xs my-4">
            <ActivityIndicator size="small" color="#2563EB" />
            <Text className="text-xs text-slate-500 mt-2 font-medium">Loading admission queue from database...</Text>
          </View>
        )}

        {/* Error State */}
        {isRequestsError && (
          <View className="bg-rose-50 border border-rose-200 rounded-3xl p-6 items-center shadow-xs my-2">
            <AlertCircle size={24} color="#E11D48" />
            <Text className="text-sm font-bold text-rose-800 mt-2 text-center">
              Unable to load admission requests
            </Text>
            <Text className="text-xs text-rose-600 text-center mt-1">
              {requestsError instanceof Error ? requestsError.message : 'Database connection error'}
            </Text>
            <TouchableOpacity
              onPress={() => refetchRequests()}
              className="mt-4 px-4 py-2 bg-rose-600 rounded-xl flex-row items-center gap-1.5"
            >
              <RefreshCw size={12} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">Retry Loading</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!isRequestsLoading && !isRequestsError && pendingRequests.length === 0 && (
          <View className="bg-white border border-slate-200 rounded-3xl p-8 items-center shadow-xs my-4">
            <Mascot mood="celebrating" size="lg" />
            <Text className="text-base font-black text-slate-800 mt-3 text-center">
              All Students Verified
            </Text>
            <Text className="text-xs text-slate-500 text-center mt-1 max-w-[240px]">
              No pending admission requests in queue. Share your academy invite code to enroll new students.
            </Text>
          </View>
        )}

        {/* Pending Requests List */}
        {!isRequestsLoading && !isRequestsError && pendingRequests.map((req) => {
          const d = req.student_details || ({} as any);
          return (
            <View
              key={req.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs gap-3"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-base font-black text-slate-800">
                    {d.fullName || req.user?.full_name || 'Student Applicant'}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {d.grade || 'Class 12'} • {d.board || 'CBSE'}
                  </Text>
                </View>
                <View className="bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-amber-800">
                    Target: {d.targetExam || 'Competitive Exam'}
                  </Text>
                </View>
              </View>

              <View className="bg-slate-50 rounded-2xl p-3 border border-slate-200 gap-1.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] text-slate-500">School / College:</Text>
                  <Text className="text-[11px] font-bold text-slate-800">{d.school || 'Not Specified'}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] text-slate-500">Prior Percentage:</Text>
                  <Text className="text-[11px] font-bold text-blue-600">{d.previousPercentage || 'N/A'}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] text-slate-500">Guardian Phone:</Text>
                  <Text className="text-[11px] font-bold text-slate-800">{d.guardianPhone || 'N/A'}</Text>
                </View>
              </View>

              {d.weakSubjects && d.weakSubjects.length > 0 && (
                <View>
                  <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    Requested Focus Areas:
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {d.weakSubjects.map((sub: string, i: number) => (
                      <View
                        key={i}
                        className="bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md"
                      >
                        <Text className="text-[10px] font-bold text-rose-800">{sub}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View className="flex-row gap-2 pt-2 border-t border-slate-200">
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => openApprovalModal(req)}
                  className="flex-1 bg-emerald-500 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 shadow-xs active:scale-98"
                >
                  <Check size={14} color="#ffffff" />
                  <Text className="text-xs font-black text-white">
                    Verify & Admit Student
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => openRejectModal(req)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 items-center justify-center active:scale-98"
                >
                  <X size={14} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ================= ASSIGN BATCH & APPROVE MODAL ================= */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center p-5">
          <View className="bg-white rounded-[32px] p-6 w-full max-w-sm border border-slate-200 shadow-lg">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <HeartHandshake size={18} color="#2563EB" />
                <Text className="text-base font-black text-slate-800">
                  Admit Student
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-slate-500 mb-4">
              Enrolling <Text className="font-bold text-slate-800">{selectedRequest?.student_details?.fullName || selectedRequest?.user?.full_name}</Text>
            </Text>

            {/* Select Batch from Real Database */}
            <Text className="text-xs font-black text-slate-800 mb-1.5">
              1. Select Batch
            </Text>
            {isBatchesLoading ? (
              <ActivityIndicator size="small" color="#2563EB" className="my-2" />
            ) : batches.length === 0 ? (
              <View className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                <Text className="text-xs text-amber-800">No active batches created in institute. Please create a batch first.</Text>
              </View>
            ) : (
              <View className="gap-1.5 mb-4 max-h-40">
                <ScrollView nestedScrollEnabled>
                  {batches.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => setSelectedBatchId(b.id)}
                      className={`p-2.5 rounded-xl border mb-1.5 ${
                        (selectedBatchId || batches[0]?.id) === b.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          (selectedBatchId || batches[0]?.id) === b.id ? 'text-blue-600' : 'text-slate-800'
                        }`}
                      >
                        {b.name}
                      </Text>
                      <Text className="text-[10px] text-slate-500">
                        {b.subject || 'All Subjects'} • {b.student_count ?? 0} Students
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Select Fee Plan */}
            <Text className="text-xs font-black text-slate-800 mb-1.5">
              2. Fee Plan Structure
            </Text>
            <View className="gap-1.5 mb-5">
              {dynamicFeePlans.map((plan) => (
                <TouchableOpacity
                  key={plan}
                  onPress={() => setSelectedFeePlan(plan)}
                  className={`p-2.5 rounded-xl border ${
                    selectedFeePlan === plan
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selectedFeePlan === plan ? 'text-blue-600' : 'text-slate-800'
                    }`}
                  >
                    {plan}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={confirmApprove}
              disabled={approveMutation.isPending || batches.length === 0}
              className={`bg-blue-600 py-3 rounded-2xl items-center shadow-xs active:scale-98 ${
                approveMutation.isPending || batches.length === 0 ? 'opacity-60' : ''
              }`}
            >
              {approveMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-xs font-black text-white">
                  Confirm Admission & Notify Student
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= REJECT MODAL ================= */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center p-5">
          <View className="bg-white rounded-[32px] p-6 w-full max-w-sm border border-slate-200 shadow-lg">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-black text-slate-800">
                Decline Admission Request
              </Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-slate-500 mb-3">
              Please enter the reason for declining {selectedRequest?.student_details?.fullName || 'student'}:
            </Text>

            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Reason for declining admission"
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 mb-4"
              multiline
              numberOfLines={3}
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                className="flex-1 py-3 bg-slate-100 rounded-xl items-center"
              >
                <Text className="text-xs font-bold text-slate-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmReject}
                disabled={rejectMutation.isPending}
                className="flex-1 py-3 bg-rose-600 rounded-xl items-center"
              >
                {rejectMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-xs font-bold text-white">Decline Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
