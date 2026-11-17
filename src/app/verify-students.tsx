import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { UserCheck, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, ListLoadingSkeleton, ListEmptyState, ListErrorState } from '@/components/ui';
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
  const [selectedFeePlan, setSelectedFeePlan] = useState<string>('Standard Monthly (₹3,500/mo)');
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

  return (
    <ScreenWrapper
      scrollable={false}
      headerProps={{
        title: 'Student Verification Queue',
        instituteName: activeInstitute?.name || 'Classroom Portal',
        onBackPress: () => router.back(),
        rightAction: (
          <TouchableOpacity onPress={() => refetchRequests()} className="p-1">
            <RefreshCw size={18} color="#1C1C1E" />
          </TouchableOpacity>
        ),
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        contentContainerClassName="gap-3.5"
      >
        <View className="bg-blue-600 rounded-3xl p-5 shadow-xs">
          <View className="flex-row items-center gap-2 mb-1">
            <UserCheck size={18} color="#93C5FD" />
            <Text className="text-sm font-display text-white">Student Admission Desk</Text>
          </View>
          <Text className="text-xs text-blue-100 leading-relaxed">
            Review incoming student registration applications, assign batches, and verify enrolled
            profiles.
          </Text>
        </View>

        {isRequestsLoading && <ListLoadingSkeleton count={3} />}

        {isRequestsError && (
          <ListErrorState
            title="Failed to Load Queue"
            message={requestsError instanceof Error ? requestsError.message : 'Please try again.'}
            onRetry={() => refetchRequests()}
          />
        )}

        {!isRequestsLoading && !isRequestsError && pendingRequests.length === 0 && (
          <ListEmptyState
            title="All Caught Up!"
            message="No students currently pending admission verification in this institute."
            actionLabel="Refresh Roster"
            onAction={() => refetchRequests()}
          />
        )}

        {pendingRequests.map((req) => (
          <VerifyRequestItem
            key={req.id}
            request={req}
            onApprove={openApprovalModal}
            onWaitlist={openWaitlistModal}
            onReject={openRejectModal}
          />
        ))}
      </ScrollView>

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
