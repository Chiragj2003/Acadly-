import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';

interface AdminCreateBatchModalProps {
  visible: boolean;
  onClose: () => void;
  batchName: string;
  onChangeBatchName: (val: string) => void;
  batchSubject: string;
  onChangeBatchSubject: (val: string) => void;
  batchExam: string;
  onChangeBatchExam: (val: string) => void;
  batchRoom: string;
  onChangeBatchRoom: (val: string) => void;
  /** Teacher assignment needs a real teacher record (teacher_id); the free-text field is hidden unless a handler is given. */
  batchTeacher?: string;
  onChangeBatchTeacher?: (val: string) => void;
  isSaving?: boolean;
  onCreate: () => void;
}

export const AdminCreateBatchModal: React.FC<AdminCreateBatchModalProps> = ({
  visible,
  onClose,
  batchName,
  onChangeBatchName,
  batchSubject,
  onChangeBatchSubject,
  batchExam,
  onChangeBatchExam,
  batchRoom,
  onChangeBatchRoom,
  batchTeacher,
  onChangeBatchTeacher,
  isSaving = false,
  onCreate,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="bg-white rounded-t-3xl max-h-[85%] p-5 border-t border-slate-200">
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <Text className="text-base font-sans-bold text-slate-900">Create New Academic Batch</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={18} color="#6E6A63" />
            </TouchableOpacity>
          </View>

          <ScrollView className="py-3 gap-3" keyboardShouldPersistTaps="handled">
            <View>
              <Text className="text-[11px] font-sans-semibold text-slate-600 mb-1">Batch Name</Text>
              <TextInput
                value={batchName}
                onChangeText={onChangeBatchName}
                placeholder="e.g. Class 12 • JEE Advanced Morning"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-[11px] font-sans-semibold text-slate-600 mb-1">Subject</Text>
                <TextInput
                  value={batchSubject}
                  onChangeText={onChangeBatchSubject}
                  placeholder="Physics & Calculus"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-sans-semibold text-slate-600 mb-1">Target Exam</Text>
                <TextInput
                  value={batchExam}
                  onChangeText={onChangeBatchExam}
                  placeholder="JEE / NEET / CBSE"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </View>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-[11px] font-sans-semibold text-slate-600 mb-1">Room / Hall</Text>
                <TextInput
                  value={batchRoom}
                  onChangeText={onChangeBatchRoom}
                  placeholder="Hall A"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </View>
              {onChangeBatchTeacher && (
                <View className="flex-1">
                  <Text className="text-[11px] font-sans-semibold text-slate-600 mb-1">Assigned Teacher</Text>
                  <TextInput
                    value={batchTeacher}
                    onChangeText={onChangeBatchTeacher}
                    placeholder="Teacher name"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={onCreate}
              disabled={isSaving}
              accessibilityState={{ disabled: isSaving, busy: isSaving }}
              className={`mt-3 bg-ink min-h-[56px] rounded-full items-center justify-center ${isSaving ? 'opacity-60' : 'active:opacity-90'}`}
            >
              <Text className="text-[17px] font-sans-bold text-white">{isSaving ? 'Saving…' : 'Create batch'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
