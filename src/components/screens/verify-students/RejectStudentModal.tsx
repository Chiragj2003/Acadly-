import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { JoinRequestRow } from '@/services/admissionService';

interface RejectStudentModalProps {
  visible: boolean;
  onClose: () => void;
  selectedRequest: JoinRequestRow | null;
  rejectReason: string;
  onChangeRejectReason: (reason: string) => void;
  onConfirmReject: () => void;
  isPending: boolean;
}

export const RejectStudentModal: React.FC<RejectStudentModalProps> = ({
  visible,
  onClose,
  selectedRequest,
  rejectReason,
  onChangeRejectReason,
  onConfirmReject,
  isPending,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 items-center justify-center p-5">
        <View className="bg-white rounded-[32px] p-6 w-full max-w-sm border border-slate-200 shadow-lg">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-display text-slate-800">Decline Admission Request</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color="#6E6A63" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-slate-500 mb-3">
            Please enter the reason for declining{' '}
            {selectedRequest?.student_details?.fullName || 'student'}:
          </Text>

          <TextInput
            value={rejectReason}
            onChangeText={onChangeRejectReason}
            placeholder="Reason for declining admission"
            className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 mb-4"
            multiline
            numberOfLines={3}
          />

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 bg-slate-100 rounded-xl items-center"
            >
              <Text className="text-xs font-sans-bold text-slate-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirmReject}
              disabled={isPending}
              className="flex-1 py-3 bg-rose-600 rounded-xl items-center"
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-xs font-sans-bold text-white">Decline Application</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
