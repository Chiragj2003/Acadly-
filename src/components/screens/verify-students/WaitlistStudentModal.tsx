import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { X, Clock } from 'lucide-react-native';
import { type JoinRequestRow } from '@/services/admissionService';

interface WaitlistStudentModalProps {
  visible: boolean;
  onClose: () => void;
  selectedRequest: JoinRequestRow | null;
  waitlistReason: string;
  onChangeWaitlistReason: (reason: string) => void;
  onConfirmWaitlist: () => void;
  isPending: boolean;
}

export const WaitlistStudentModal: React.FC<WaitlistStudentModalProps> = ({
  visible,
  onClose,
  selectedRequest,
  waitlistReason,
  onChangeWaitlistReason,
  onConfirmWaitlist,
  isPending,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 items-center justify-center p-5">
        <View className="bg-white rounded-[32px] p-6 w-full max-w-sm border border-slate-200 shadow-lg">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Clock size={16} color="#7C3AED" />
              <Text className="text-base font-black text-slate-800">Place on Waitlist</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-slate-500 mb-3">
            Please enter a reason or expected intake timeline for{' '}
            {selectedRequest?.student_details?.fullName || 'student'}:
          </Text>

          <TextInput
            value={waitlistReason}
            onChangeText={onChangeWaitlistReason}
            placeholder="e.g. Waitlisted for upcoming batch intake (Seats full)"
            className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 mb-4"
            multiline
            numberOfLines={3}
          />

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 bg-slate-100 rounded-xl items-center"
            >
              <Text className="text-xs font-bold text-slate-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirmWaitlist}
              disabled={isPending}
              className="flex-1 py-3 bg-purple-600 rounded-xl items-center"
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-xs font-bold text-white">Place on Waitlist</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
