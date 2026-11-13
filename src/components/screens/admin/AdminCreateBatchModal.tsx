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
  batchTeacher: string;
  onChangeBatchTeacher: (val: string) => void;
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
            <Text className="text-base font-bold text-slate-900">Create New Academic Batch</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView className="py-3 gap-3" keyboardShouldPersistTaps="handled">
            <View>
              <Text className="text-[11px] font-semibold text-slate-600 mb-1">Batch Name</Text>
              <TextInput
                value={batchName}
                onChangeText={onChangeBatchName}
                placeholder="e.g. Class 12 • JEE Advanced Morning"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-slate-600 mb-1">Subject</Text>
                <TextInput
                  value={batchSubject}
                  onChangeText={onChangeBatchSubject}
                  placeholder="Physics & Calculus"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-slate-600 mb-1">Target Exam</Text>
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
                <Text className="text-[11px] font-semibold text-slate-600 mb-1">Room / Hall</Text>
                <TextInput
                  value={batchRoom}
                  onChangeText={onChangeBatchRoom}
                  placeholder="Hall A"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-slate-600 mb-1">Assigned Teacher</Text>
                <TextInput
                  value={batchTeacher}
                  onChangeText={onChangeBatchTeacher}
                  placeholder="Prof. Vikram Joshi"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={onCreate}
              className="mt-3 bg-purple-600 py-3 rounded-2xl items-center shadow-xs active:scale-98"
            >
              <Text className="text-xs font-bold text-white">Save & Launch Batch</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
