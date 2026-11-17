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
import { X, Paperclip, Send } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

interface AskQuestionModalProps {
  visible: boolean;
  onClose: () => void;
  subjects: string[];
  onSubmit: (data: {
    title: string;
    content: string;
    subject: string;
    fileUri?: string;
    fileName?: string;
  }) => Promise<void>;
  loading: boolean;
}

export const AskQuestionModal: React.FC<AskQuestionModalProps> = ({
  visible,
  onClose,
  subjects,
  onSubmit,
  loading,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState(subjects[0] || 'Physics');
  const [attachedFile, setAttachedFile] = useState<{ uri: string; name: string } | null>(null);

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setAttachedFile({ uri: file.uri, name: file.name });
      }
    } catch {
      Alert.alert('Error', 'Could not open file picker');
    }
  };

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Required', 'Please enter both a title and details for your doubt.');
      return;
    }

    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      subject,
      fileUri: attachedFile?.uri,
      fileName: attachedFile?.name,
    });

    setTitle('');
    setContent('');
    setAttachedFile(null);
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
            <Text className="text-base font-sans-bold text-slate-900">Ask the Academic Community</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={18} color="#6E6A63" />
            </TouchableOpacity>
          </View>

          <ScrollView className="py-3 gap-3" keyboardShouldPersistTaps="handled">
            <View>
              <Text className="text-[11px] font-sans-semibold text-slate-600 mb-1">Subject</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                {subjects.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSubject(s)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      subject === s ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`text-xs font-sans-bold ${subject === s ? 'text-white' : 'text-slate-700'}`}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View>
              <Text className="text-[11px] font-sans-semibold text-slate-600 mb-1">Doubt Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Why does angular momentum conserve in torque-free systems?"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </View>

            <View>
              <Text className="text-[11px] font-sans-semibold text-slate-600 mb-1">Description / Equation</Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Explain the step where you're getting stuck..."
                multiline
                numberOfLines={4}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 min-h-[90px]"
              />
            </View>

            <View className="flex-row items-center justify-between pt-1">
              <TouchableOpacity
                onPress={handlePickDocument}
                className="flex-row items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-xl"
              >
                <Paperclip size={14} color="#6E6A63" />
                <Text className="text-xs text-slate-700 font-sans" numberOfLines={1}>
                  {attachedFile ? attachedFile.name : 'Attach Question Image or PDF'}
                </Text>
              </TouchableOpacity>
              {attachedFile && (
                <TouchableOpacity onPress={() => setAttachedFile(null)}>
                  <Text className="text-xs text-rose-600 font-sans-bold">Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={handlePost}
              disabled={loading}
              className="mt-3 bg-blue-600 py-3 rounded-2xl items-center flex-row justify-center gap-2 shadow-xs active:scale-98"
            >
              <Send size={15} color="white" />
              <Text className="text-xs font-sans-bold text-white">
                {loading ? 'Posting...' : 'Post to Community'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
