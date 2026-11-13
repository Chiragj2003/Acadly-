import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Upload, FileText } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

interface UploadPdfModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    subject: string;
    category: string;
    fileUri: string;
    fileName: string;
  }) => Promise<void>;
  loading: boolean;
}

export const UploadPdfModal: React.FC<UploadPdfModalProps> = ({
  visible,
  onClose,
  onSubmit,
  loading,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [category, setCategory] = useState('notes');
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string } | null>(null);

  const handlePick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setPickedFile({ uri: res.assets[0].uri, name: res.assets[0].name });
      }
    } catch {
      Alert.alert('Error', 'Could not open document picker');
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !pickedFile) {
      Alert.alert('Required', 'Please enter a title and select a PDF document.');
      return;
    }

    await onSubmit({
      title: title.trim(),
      subject,
      category,
      fileUri: pickedFile.uri,
      fileName: pickedFile.name,
    });

    setTitle('');
    setPickedFile(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="bg-white rounded-t-3xl max-h-[85%] p-5 border-t border-slate-200">
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <Text className="text-base font-bold text-slate-900">Upload Study Material (PDF)</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView className="py-3 gap-3" keyboardShouldPersistTaps="handled">
            <View>
              <Text className="text-[11px] font-semibold text-slate-600 mb-1">Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Kinematics & 2D Motion Formula Sheet"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-slate-600 mb-1">Subject</Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Physics"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-slate-600 mb-1">Category</Text>
                <TextInput
                  value={category}
                  onChangeText={setCategory}
                  placeholder="notes / dpp / pyq"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handlePick}
              className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 items-center justify-center gap-1.5"
            >
              <FileText size={24} color="#64748b" />
              <Text className="text-xs font-bold text-slate-700">
                {pickedFile ? pickedFile.name : 'Select PDF from Device'}
              </Text>
              <Text className="text-[10px] text-slate-400">PDF documents up to 20 MB</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleUpload}
              disabled={loading || !pickedFile}
              className="mt-3 bg-blue-600 py-3 rounded-2xl items-center flex-row justify-center gap-2 shadow-xs active:scale-98"
            >
              <Upload size={15} color="white" />
              <Text className="text-xs font-bold text-white">
                {loading ? 'Uploading...' : 'Publish to Library'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
