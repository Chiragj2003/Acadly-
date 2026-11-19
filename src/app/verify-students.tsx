import React, { useState } from 'react';
import { View, Text, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ChevronLeft, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, ListLoadingSkeleton, ListErrorState, DisplayTitle, Mascot } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import {
  useJoinRequests,
  useApproveJoinRequest,
  useRejectJoinRequest,
  useWaitlistJoinRequest,
} from '@/hooks/queries/useAdmissionQueries';
import { useBatches } from '@/hooks/queries/useBatchQueries';
import { JoinRequestRow } from '@/services/admissionService';
import { VerifyRequestItem } from '@/components/screens/verify-students/VerifyRequestItem';
import { ApproveStudentModal } from '@/components/screens/verify-students/ApproveStudentModal';
import { RejectStudentModal } from '@/components/screens/verify-students/RejectStudentModal';
import { WaitlistStudentModal } from '@/components/screens/verify-students/WaitlistStudentModal';

export default function VerifyStudentsScreen() {
  const router = useRouter();
  const { isAuthorized, isLoading: isGuardLoading } = useRoleGuard(['teacher', 'admin']);
  const { user, activeInstitute } = useAuth();

  const {
    data: requests = [],
    isLoading: isRequestsLoading,
    isError: isRequestsError,
    error: requestsError,
    refetch: refetchRequests,
  } = useJoinRequests(activeInstitute?.id);

  const { data: batches = [], isLoading: isBatchesLoading } = useBatches(activeInstitute?.id);

  const approveMutation = useApproveJoinRequest();
  const rejectMutation = useRejectJoinRequest();
  const waitlistMutation = useWaitlistJoinRequest();

  const [selectedRequest, setSelectedRequest] = useState<JoinRequestRow | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedFeePlan, setSelectedFeePlan] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('Seat capacity reached for current intake');
  const [waitlistModalVisible, setWaitlistModalVisible] = useState(false);
  const [waitlistReason, setWaitlistReason] = useState('Waitlisted for upcoming batch intake (Seats currently full)');

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  if (isGuardLoading || !isAuthorized) {
    return (
      <ScreenWrapper headerProps={{ title: 'Verification Desk', onBackPress: () => router.back() }}>
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="small" color="#1C1C1E" />
          <Text className="text-xs text-slate-500 mt-2 font-sans">Verifying credentials...</Text>
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

  const openWaitlistModal = (req: JoinRequestRow) => {
    setSelectedRequest(req);
    setWaitlistReason('Waitlisted for upcoming batch intake (Seats currently full)');
    setWaitlistModalVisible(true);
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

      const assignedBatchName =
        batches.find((b) => b.id === targetBatchId)?.name || 'Classroom Batch';
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

  const confirmWaitlist = async () => {
    if (!selectedRequest || !user) return;
    try {
      await waitlistMutation.mutateAsync({
        requestId: selectedRequest.id,
        reason: waitlistReason.trim(),
        reviewerId: user.id,
      });
      setWaitlistModalVisible(false);
      Alert.alert('Waitlisted ⏳', 'Student has been placed on the admissions waitlist.');
      setSelectedRequest(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Waitlist update failed';
      Alert.alert('Error', msg);
    }
  };

  const tones = ['pink', 'sky', 'mint', 'lilac'] as const;

  return (
    <ScreenWrapper contentContainerClassName="gap-4 px-5 pt-3">
      <View className="flex-row items-center justify-between h-12">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          className="w-12 h-12 rounded-full bg-white items-center justify-center"
        >
          <ChevronLeft size={22} color="#1C1C1E" />
        </TouchableOpacity>
        <Text className="font-sans-bold text-ink text-sm">
          {pendingRequests.length > 0 ? `${pendingRequests.length} waiting` : 'All clear'}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Refresh"
          onPress={() => refetchRequests()}
          className="w-12 h-12 rounded-full bg-white items-center justify-center"
        >
          <RefreshCw size={18} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <DisplayTitle center>{pendingRequests.length > 0 ? 'New join requests' : 'You’re all caught up.'}</DisplayTitle>

      {isRequestsLoading && <ListLoadingSkeleton count={2} height={240} />}

      {isRequestsError && (
        <ListErrorState
          title="Couldn’t load requests"
          message={requestsError instanceof Error ? requestsError.message : 'Please try again.'}
          onRetry={() => refetchRequests()}
        />
      )}

      {!isRequestsLoading && !isRequestsError && pendingRequests.length === 0 && (
        <View className="items-center gap-4 py-6">
          <Mascot mood="celebrating" size="xl" />
          <Text className="font-sans text-slate-600 text-[15px] text-center px-6">
            New requests appear here when students use your join code.
          </Text>
        </View>
      )}

      {pendingRequests.map((req, i) => (
        <VerifyRequestItem
          key={req.id}
          request={req}
          hero={i === 0}
          tone={tones[i % tones.length]}
          onApprove={openApprovalModal}
          onWaitlist={openWaitlistModal}
          onReject={openRejectModal}
        />
      ))}

      <ApproveStudentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedRequest={selectedRequest}
        batches={batches}
        isBatchesLoading={isBatchesLoading}
        selectedBatchId={selectedBatchId}
        onSelectBatchId={setSelectedBatchId}
        selectedFeePlan={selectedFeePlan}
        onSelectFeePlan={setSelectedFeePlan}
        onConfirmApprove={confirmApprove}
        isPending={approveMutation.isPending}
      />

      <WaitlistStudentModal
        visible={waitlistModalVisible}
        onClose={() => setWaitlistModalVisible(false)}
        selectedRequest={selectedRequest}
        waitlistReason={waitlistReason}
        onChangeWaitlistReason={setWaitlistReason}
        onConfirmWaitlist={confirmWaitlist}
        isPending={waitlistMutation.isPending}
      />

      <RejectStudentModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        selectedRequest={selectedRequest}
        rejectReason={rejectReason}
        onChangeRejectReason={setRejectReason}
        onConfirmReject={confirmReject}
        isPending={rejectMutation.isPending}
      />
    </ScreenWrapper>
  );
}
