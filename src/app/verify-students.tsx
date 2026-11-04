import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  UserCheck,
  Check,
  X,
  HeartHandshake,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Mascot } from '@/components/ui';
import { useAcademic, JoinRequest } from '@/context/AcademicContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';

const BATCH_CHOICES = [
  { id: 'Class 12 • JEE Advanced (Morning)', name: 'Class 12 • JEE Advanced' },
  { id: 'Class 11 • Physics & Calculus Mastery', name: 'Class 11 • Physics & Calculus' },
  { id: 'NEET-UG • Target 680+ Batch', name: 'NEET-UG • Target 680+' },
  { id: 'Class 10 CBSE • Board Toppers', name: 'Class 10 CBSE • Board Toppers' },
];

const FEE_PLAN_CHOICES = [
  'Standard Monthly (₹3,500/mo)',
  'Quarterly Saver (₹9,500/qtr)',
  'Annual Topper Scholarship (₹32,000/yr)',
];

export default function VerifyStudentsScreen() {
  const router = useRouter();
  const { isAuthorized, isLoading } = useRoleGuard(['teacher', 'admin']);
  const {
    joinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    teacherProfile,
  } = useAcademic();

  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null);
  const [selectedBatch, setSelectedBatch] = useState(BATCH_CHOICES[0].id);
  const [selectedFeePlan, setSelectedFeePlan] = useState(FEE_PLAN_CHOICES[0]);
  const [modalVisible, setModalVisible] = useState(false);

  // Filter pending requests
  const pendingRequests = joinRequests.filter((r) => r.status === 'pending');

  if (isLoading || !isAuthorized) {
    return (
      <ScreenWrapper headerProps={{ title: 'Verification Desk', onBackPress: () => router.back() }}>
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="small" color="#2563EB" />
          <Text className="text-xs text-slate-500 mt-2 font-medium">Verifying authorization...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const openApprovalModal = (req: JoinRequest) => {
    setSelectedRequest(req);
    setModalVisible(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;
    await approveJoinRequest(selectedRequest.id, selectedBatch, selectedFeePlan);
    setModalVisible(false);
    Alert.alert(
      'Student Verified & Enrolled',
      `${selectedRequest.studentDetails.fullName} has been successfully assigned to ${selectedBatch}. They now appear in your active class roster.`
    );
    setSelectedRequest(null);
  };

  const handleReject = (req: JoinRequest) => {
    Alert.alert(
      'Decline Join Request',
      `Decline admission request for ${req.studentDetails.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            await rejectJoinRequest(req.id, 'Seat capacity full for current session');
            Alert.alert('Request Declined', 'Student has been notified.');
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper
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
                  Code: <Text className="font-bold text-blue-600">{teacherProfile.teacherCode}</Text>
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
            Review applicant backgrounds, assign their study batch, and confirm fee structures before granting classroom access.
          </Text>
        </View>

        {/* Pending Requests List */}
        {pendingRequests.length === 0 ? (
          <View className="bg-white border border-slate-200 rounded-3xl p-8 items-center shadow-xs my-4">
            <Mascot mood="celebrating" size="lg" />
            <Text className="text-base font-black text-slate-800 mt-3 text-center">
              All Students Verified
            </Text>
            <Text className="text-xs text-slate-500 text-center mt-1 max-w-[240px]">
              No pending admission requests in queue. Share your teacher code{' '}
              <Text className="font-bold text-blue-600">{teacherProfile.teacherCode}</Text> to invite students.
            </Text>
          </View>
        ) : (
          pendingRequests.map((req) => {
            const d = req.studentDetails;
            return (
              <View
                key={req.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs gap-3"
              >
                {/* Header */}
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-base font-black text-slate-800">
                      {d.fullName}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {d.grade} • {d.board}
                    </Text>
                  </View>
                  <View className="bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-amber-800">
                      Target: {d.targetExam}
                    </Text>
                  </View>
                </View>

                {/* Details Grid */}
                <View className="bg-slate-50 rounded-2xl p-3 border border-slate-200 gap-1.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11px] text-slate-500">School:</Text>
                    <Text className="text-[11px] font-bold text-slate-800">{d.school}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11px] text-slate-500">Prior Performance:</Text>
                    <Text className="text-[11px] font-bold text-blue-600">{d.previousPercentage}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11px] text-slate-500">Guardian Phone:</Text>
                    <Text className="text-[11px] font-bold text-slate-800">{d.guardianPhone}</Text>
                  </View>
                </View>

                {/* Weak Subjects */}
                {d.weakSubjects && d.weakSubjects.length > 0 && (
                  <View>
                    <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                      Requested Help in Focus Areas:
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {d.weakSubjects.map((sub, i) => (
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

                {/* Action Buttons */}
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
                    onPress={() => handleReject(req)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 items-center justify-center active:scale-98"
                  >
                    <X size={14} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
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
              Enrolling <Text className="font-bold text-slate-800">{selectedRequest?.studentDetails.fullName}</Text>
            </Text>

            {/* Select Batch */}
            <Text className="text-xs font-black text-slate-800 mb-1.5">
              1. Select Batch
            </Text>
            <View className="gap-1.5 mb-4">
              {BATCH_CHOICES.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setSelectedBatch(b.id)}
                  className={`p-2.5 rounded-xl border ${
                    selectedBatch === b.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selectedBatch === b.id ? 'text-blue-600' : 'text-slate-800'
                    }`}
                  >
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Select Fee Plan */}
            <Text className="text-xs font-black text-slate-800 mb-1.5">
              2. Fee Plan Structure
            </Text>
            <View className="gap-1.5 mb-5">
              {FEE_PLAN_CHOICES.map((plan) => (
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
              className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs active:scale-98"
            >
              <Text className="text-xs font-black text-white">
                Confirm Admission & Notify Student
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
