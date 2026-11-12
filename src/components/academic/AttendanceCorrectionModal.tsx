import React, { useState } from 'react';
import { View, Text, Modal, Pressable, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useCorrectAttendance } from '@/hooks/queries/useAttendanceQueries';
import { type AttendanceRecord } from '@/types/database';
import { AttendanceToggle, Button, Input } from '@/components/ui';

export interface AttendanceCorrectionModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
}

export const AttendanceCorrectionModal: React.FC<AttendanceCorrectionModalProps> = ({
  record,
  onClose,
}) => {
  const { user } = useAuth();
  const correctMutation = useCorrectAttendance();
  const [newStatus, setNewStatus] = useState<'P' | 'A' | 'L'>('P');
  const [reason, setReason] = useState('');

  if (!record) return null;

  const handleSaveCorrection = async () => {
    if (!reason.trim()) {
      Alert.alert('Audit Required', 'Please enter a valid reason for this attendance correction.');
      return;
    }

    try {
      await correctMutation.mutateAsync({
        attendanceId: record.id,
        oldStatus: record.status === 'E' ? 'P' : record.status,
        newStatus,
        reason: reason.trim(),
        correctedBy: user?.id || record.marked_by || 'system',
        studentId: record.student_id,
        studentName: record.student_name,
      });

      onClose();
      Alert.alert(
        'Attendance Corrected',
        `Updated ${record.student_name}'s status to ${
          newStatus === 'P' ? 'Present' : newStatus === 'A' ? 'Absent' : 'Late'
        }. Reason recorded in audit log.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Correction failed';
      Alert.alert('Correction Error', msg);
    }
  };

  return (
    <Modal visible={Boolean(record)} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-surface rounded-t-3xl p-5 max-h-[85%]">
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14 }}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-bold text-on-surface">Correct Attendance</Text>
                <Text className="text-xs text-on-surface-variant">
                  Student: {record.student_name} ({record.roll_number})
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={20} color="#0b1c30" />
              </Pressable>
            </View>

            <View className="p-3 rounded-xl bg-surface-container-low flex-row items-center justify-between">
              <Text className="text-xs text-on-surface-variant">Current Logged Status:</Text>
              <Text className="text-xs font-bold text-secondary">
                {record.status === 'P' ? 'Present' : record.status === 'A' ? 'Absent' : 'Late'}
              </Text>
            </View>

            <View className="gap-1.5">
              <Text className="text-sm font-semibold text-on-surface">Select New Status</Text>
              <AttendanceToggle
                value={newStatus}
                onChange={(s) => setNewStatus(s)}
              />
            </View>

            <Input
              label="Correction Reason / Remark (Audit Trail)"
              placeholder="e.g. Parent sent medical leave note via WhatsApp"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />

            <Button
              variant="primary"
              title={correctMutation.isPending ? 'Saving Correction...' : 'Commit Status Correction'}
              fullWidth
              onPress={handleSaveCorrection}
              disabled={correctMutation.isPending}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
