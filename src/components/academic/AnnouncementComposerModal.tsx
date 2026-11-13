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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Megaphone, Bell, Check } from 'lucide-react-native';
import { usePostAnnouncement } from '@/hooks/queries/useAnnouncementQueries';

interface AnnouncementComposerModalProps {
  visible: boolean;
  onClose: () => void;
  instituteId: string;
  batchId?: string;
  batchName?: string;
}

export const AnnouncementComposerModal: React.FC<AnnouncementComposerModalProps> = ({
  visible,
  onClose,
  instituteId,
  batchId,
  batchName,
}) => {
  const postMutation = usePostAnnouncement();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [scope, setScope] = useState<'batch' | 'all'>('batch');

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an announcement title.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Required', 'Please write the announcement message.');
      return;
    }

    try {
      await postMutation.mutateAsync({
        instituteId,
        batchId: scope === 'batch' ? batchId : null,
        title: title.trim(),
        content: content.trim(),
        priority,
      });

      Alert.alert('Announcement Broadcasted 📢', 'Notification has been dispatched to enrolled students.');
      setTitle('');
      setContent('');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Broadcast failed';
      Alert.alert('Broadcast Error', msg);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white rounded-t-3xl p-5 max-h-[88%] border-t border-slate-200">
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View className="flex-row items-center gap-2">
              <Megaphone size={18} color="#2563EB" />
              <Text className="text-base font-extrabold text-slate-900">Broadcast Notice</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14, paddingVertical: 14 }}>
            {/* Scope Selector */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setScope('batch')}
                className={`flex-1 p-2.5 rounded-xl border items-center ${
                  scope === 'batch' ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text className={`text-xs font-bold ${scope === 'batch' ? 'text-white' : 'text-slate-700'}`}>
                  {batchName ? `Batch: ${batchName}` : 'Current Batch'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setScope('all')}
                className={`flex-1 p-2.5 rounded-xl border items-center ${
                  scope === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text className={`text-xs font-bold ${scope === 'all' ? 'text-white' : 'text-slate-700'}`}>
                  All Institute Batches
                </Text>
              </TouchableOpacity>
            </View>

            {/* Priority Selector */}
            <View className="flex-row items-center gap-2">
              <Text className="text-[11px] font-bold text-slate-500 uppercase">Priority:</Text>
              <TouchableOpacity
                onPress={() => setPriority('normal')}
                className={`px-3 py-1 rounded-full border ${
                  priority === 'normal' ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text className={`text-[10px] font-bold ${priority === 'normal' ? 'text-blue-700' : 'text-slate-600'}`}>
                  Normal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPriority('urgent')}
                className={`px-3 py-1 rounded-full border ${
                  priority === 'urgent' ? 'bg-rose-50 border-rose-400' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text className={`text-[10px] font-bold ${priority === 'urgent' ? 'text-rose-700' : 'text-slate-600'}`}>
                  Urgent ⚡
                </Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View>
              <Text className="text-[11px] font-bold text-slate-600 mb-1">Notice Headline</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Extra Physics Problem Solving Session Tomorrow"
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold"
              />
            </View>

            {/* Content */}
            <View>
              <Text className="text-[11px] font-bold text-slate-600 mb-1">Detailed Message</Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Write the full instructions or details for students..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 min-h-[90px]"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handlePost}
              disabled={postMutation.isPending}
              className="bg-blue-600 py-3 rounded-2xl items-center flex-row justify-center gap-1.5 shadow-xs active:scale-98"
            >
              {postMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Bell size={14} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Broadcast Announcement & Push</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
