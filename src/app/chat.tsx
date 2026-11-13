import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Users } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { ScreenWrapper } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChat, ChatMessage } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useStudentsRoster } from '@/hooks/queries/useStudentQueries';
import {
  ChatMessageItem,
  ChatRoomTabs,
  ChatInputBar,
} from '@/components/screens/chat';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole, activeInstitute } = useAuth();
  const { data: studentsRoster = [] } = useStudentsRoster(activeInstitute?.id);
  const {
    rooms,
    activeRoomId,
    setActiveRoomId,
    activeRoom,
    messages,
    sendMessage,
    pinMessage,
    unpinMessage,
    markRoomAsRead,
    createNewDirectChat,
  } = useChat();

  const isTeacher = userRole === 'teacher';
  const flashListRef = useRef<any>(null);

  const [inputText, setInputText] = useState('');
  const [stagedAttachment, setStagedAttachment] = useState<{
    name: string;
    uri: string;
    type: 'image' | 'pdf';
    size?: string;
  } | null>(null);

  // Mark room as read on load & room switch
  useEffect(() => {
    if (activeRoomId) {
      markRoomAsRead(activeRoomId);
    }
  }, [activeRoomId, markRoomAsRead]);

  // Paginated messages (30 most recent for performance)
  const displayMessages = useMemo(() => {
    if (messages.length <= 30) return messages;
    return messages.slice(messages.length - 30);
  }, [messages]);

  // Pick Document or Image
  const handlePickAttachment = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        const isPdf = file.mimeType === 'application/pdf' || file.name.endsWith('.pdf');
        const formattedSize = file.size
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : '1.2 MB';

        setStagedAttachment({
          name: file.name,
          uri: file.uri,
          type: isPdf ? 'pdf' : 'image',
          size: formattedSize,
        });
      }
    } catch {
      Alert.alert('Attachment', 'Could not open file picker.');
    }
  };

  // Send Message
  const handleSend = async () => {
    if (!inputText.trim() && !stagedAttachment) return;
    const textToSend = inputText;
    const attachmentToSend = stagedAttachment;

    setInputText('');
    setStagedAttachment(null);

    await sendMessage(textToSend, attachmentToSend || undefined);
  };

  // Pin message (Teacher action)
  const handlePin = useCallback((msg: ChatMessage) => {
    if (!isTeacher) return;
    Alert.alert(
      'Pin Announcement',
      `Pin this message to the top of ${activeRoom?.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pin Announcement',
          onPress: () => pinMessage(msg.id),
        },
      ]
    );
  }, [isTeacher, activeRoom?.title, pinMessage]);

  const quickChips = useMemo(() => {
    return isTeacher
      ? [
          'DPP solutions uploaded',
          'Class starts in 15 mins',
          'Important formula sheet shared',
        ]
      : [
          'Could you review question 3?',
          'When is the next live class?',
          'Where can I find the formula sheet?',
        ];
  }, [isTeacher]);

  return (
    <ScreenWrapper
      scrollable={false}
      keyboardAvoiding={false}
      headerProps={{
        title: activeRoom?.title || 'Classroom Chat',
        instituteName: activeRoom?.subtitle,
        onBackPress: () => router.back(),
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 56 + insets.top : 0}
        className="flex-1"
      >
        {/* ROOM SELECTOR TABS */}
        <ChatRoomTabs
          rooms={rooms}
          activeRoomId={activeRoomId}
          onSelectRoom={setActiveRoomId}
          isTeacher={isTeacher}
          studentsRoster={studentsRoster}
          onCreateDirectChat={createNewDirectChat}
        />

        {/* PINNED ANNOUNCEMENT BANNER */}
        {activeRoom?.pinnedMessage && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-3 flex-row items-start gap-2 shadow-xs">
            <Text className="text-base">📌</Text>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                  Pinned by {activeRoom.pinnedMessage.senderName}
                </Text>
                {isTeacher && (
                  <TouchableOpacity
                    onPress={() => unpinMessage(activeRoom.id)}
                    className="p-0.5"
                  >
                    <X size={12} color="#92400e" />
                  </TouchableOpacity>
                )}
              </View>
              <Text className="text-xs text-amber-950 font-bold mt-0.5 leading-snug">
                {activeRoom.pinnedMessage.text}
              </Text>
            </View>
          </View>
        )}

        {/* MESSAGES LIST USING FLASHLIST */}
        <View className="flex-1">
          {displayMessages.length === 0 ? (
            <View className="items-center justify-center py-12">
              <View className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center mb-2">
                <Users size={24} color="#2563EB" />
              </View>
              <Text className="text-sm font-bold text-slate-800">
                Start the conversation!
              </Text>
              <Text className="text-xs text-slate-500 text-center max-w-[220px] mt-0.5">
                Ask a conceptual question or share a doubt with your faculty.
              </Text>
            </View>
          ) : (
            <FlashList
              ref={flashListRef}
              data={displayMessages}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isMine =
                  (isTeacher && item.senderRole === 'teacher') ||
                  (!isTeacher && item.senderRole === 'student');
                return (
                  <ChatMessageItem
                    message={item}
                    isMine={isMine}
                    isTeacher={isTeacher}
                    activeRoom={activeRoom}
                    onPin={handlePin}
                  />
                );
              }}
            />
          )}
        </View>

        {/* INPUT DOCK */}
        <ChatInputBar
          inputText={inputText}
          setInputText={setInputText}
          stagedAttachment={stagedAttachment}
          setStagedAttachment={setStagedAttachment}
          onPickAttachment={handlePickAttachment}
          onSend={handleSend}
          isTeacher={isTeacher}
          quickChips={quickChips}
        />
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
