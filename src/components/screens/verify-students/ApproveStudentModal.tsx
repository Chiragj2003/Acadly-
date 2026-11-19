import { FEATURE_FEES } from '@/config/features';
import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { HeartHandshake, X } from 'lucide-react-native';
import { JoinRequestRow } from '@/services/admissionService';
import { Batch } from '@/types/database';

interface ApproveStudentModalProps {
  visible: boolean;
  onClose: () => void;
  selectedRequest: JoinRequestRow | null;
  batches: Batch[];
  isBatchesLoading: boolean;
  selectedBatchId: string;
  onSelectBatchId: (id: string) => void;
  selectedFeePlan: string;
  onSelectFeePlan: (plan: string) => void;
  onConfirmApprove: () => void;
  isPending: boolean;
}

const DYNAMIC_FEE_PLANS = [
  'Standard Monthly (₹3,500/mo)',
  'Quarterly Saver (₹9,500/qtr)',
  'Scholarship Tier (Exempt)',
];

export const ApproveStudentModal: React.FC<ApproveStudentModalProps> = ({
  visible,
  onClose,
  selectedRequest,
  batches,
  isBatchesLoading,
  selectedBatchId,
  onSelectBatchId,
  selectedFeePlan,
  onSelectFeePlan,
  onConfirmApprove,
  isPending,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 items-center justify-center p-5">
        <View className="bg-white rounded-[32px] p-6 w-full max-w-sm border border-slate-200 shadow-lg">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <HeartHandshake size={18} color="#1C1C1E" />
              <Text className="text-base font-display text-slate-800">Admit Student</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color="#6E6A63" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-slate-500 mb-4">
            Enrolling{' '}
            <Text className="font-sans-bold text-slate-800">
              {selectedRequest?.student_details?.fullName || selectedRequest?.user?.full_name}
            </Text>
          </Text>

          {/* Select Batch */}
          <Text className="text-xs font-display text-slate-800 mb-1.5">1. Select Batch</Text>
          {isBatchesLoading ? (
            <ActivityIndicator size="small" color="#1C1C1E" className="my-2" />
          ) : batches.length === 0 ? (
            <View className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <Text className="text-xs text-amber-800">
                No active batches created in institute. Please create a batch first.
              </Text>
            </View>
          ) : (
            <View className="gap-1.5 mb-4 max-h-40">
              <ScrollView nestedScrollEnabled>
                {batches.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => onSelectBatchId(b.id)}
                    className={`p-2.5 rounded-xl border mb-1.5 ${
                      (selectedBatchId || batches[0]?.id) === b.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-sans-bold ${
                        (selectedBatchId || batches[0]?.id) === b.id
                          ? 'text-blue-600'
                          : 'text-slate-800'
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

          {/* Select Fee Plan — only when the fees feature is on (v1 is free) */}
          {FEATURE_FEES && (<>
          <Text className="text-xs font-display text-slate-800 mb-1.5">2. Fee Plan Structure</Text>
          <View className="gap-1.5 mb-5">
            {DYNAMIC_FEE_PLANS.map((plan) => (
              <TouchableOpacity
                key={plan}
                onPress={() => onSelectFeePlan(plan)}
                className={`p-2.5 rounded-xl border ${
                  selectedFeePlan === plan
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-sans-bold ${
                    selectedFeePlan === plan ? 'text-blue-600' : 'text-slate-800'
                  }`}
                >
                  {plan}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          </>)}

          {/* Confirm Button */}
          <TouchableOpacity
            onPress={onConfirmApprove}
            disabled={isPending || batches.length === 0}
            className={`bg-blue-600 py-3 rounded-2xl items-center shadow-xs active:scale-98 ${
              isPending || batches.length === 0 ? 'opacity-60' : ''
            }`}
          >
            {isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-xs font-display text-white">
                Confirm Admission & Notify Student
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
