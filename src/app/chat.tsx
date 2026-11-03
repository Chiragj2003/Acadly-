import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Send,
  Paperclip,
  Pin,
  X,
  FileText,
  Users,
  User,
  Plus,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { useChat, ChatMessage } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useAcademic } from '@/context/AcademicContext';

export default function PinterestChatScreen() {
  const router = useRouter();
  const { userRole } = useAuth();
  const { teacherProfile, studentsRoster } = useAcademic();
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
  const scrollViewRef = useRef<any>(null);

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
  }, [activeRoomId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, [messages.length]);

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
  const handlePin = (msg: ChatMessage) => {
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
  };

  // Quick Chips
  const quickDoubtChips = isTeacher
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

  return (
    <ScreenWrapper
      scrollable={false}
      headerProps={{
        title: activeRoom?.title || 'Classroom Chat',
        instituteName: activeRoom?.subtitle,
        onBackPress: () => router.back(),
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        className="flex-1"
      >
        {/* ================= ROOM SELECTOR TABS ================= */}
        <View className="mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 px-1">
              {rooms.map((room) => {
                const isSelected = activeRoomId === room.id;
                const displayTitle =
                  room.type === 'batch_group'
                    ? (room.title.includes(' • ') ? room.title.split(' • ')[1] : room.title)
                    : room.title.replace('Doubt Room: ', '');

                return (
                  <TouchableOpacity
                    key={room.id}
                    onPress={() => setActiveRoomId(room.id)}
                    className={`px-3.5 py-2 rounded-2xl border flex-row items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <Text className="text-sm">{room.avatarEmoji}</Text>
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      {displayTitle}
                    </Text>

                    {room.unreadCount > 0 && !isSelected && (
                      <View className="bg-rose-500 w-4 h-4 rounded-full items-center justify-center">
                        <Text className="text-[9px] font-black text-white">
                          {room.unreadCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Direct Chat with Students (For Teacher) */}
              {isTeacher && (
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Start 1-on-1 Chat',
                      'Select a verified student from your batch roster:',
                      studentsRoster.map((st) => ({
                        text: `${st.name} (${st.rollNumber})`,
                        onPress: () => createNewDirectChat(st.name, 'student', st.id),
                      }))
                    );
                  }}
                  className="px-3 py-2 rounded-2xl bg-white border border-slate-200 flex-row items-center gap-1 active:scale-95"
                >
                  <Plus size={13} color="#2563EB" />
                  <Text className="text-xs font-bold text-blue-600">Direct Student</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>

        {/* ================= PINNED ANNOUNCEMENT BANNER ================= */}
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

        {/* ================= MESSAGES SCROLL LIST ================= */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerClassName="gap-3 pb-4"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
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
            messages.map((msg) => {
              const isMine =
                (isTeacher && msg.senderRole === 'teacher') ||
                (!isTeacher && msg.senderRole === 'student');

              return (
                <View
                  key={msg.id}
                  className={`flex-row ${isMine ? 'justify-end' : 'justify-start'} items-end gap-1.5`}
                >
                  {/* Avatar for other participant */}
                  {!isMine && (
                    <View className="w-8 h-8 rounded-full bg-white border border-slate-200 items-center justify-center shadow-xs mb-1">
                      <Text className="text-xs">{msg.senderAvatarEmoji}</Text>
                    </View>
                  )}

                  <View className="max-w-[80%]">
                    {/* Author label for group chat */}
                    {!isMine && activeRoom?.type === 'batch_group' && (
                      <View className="flex-row items-center gap-1.5 mb-1 px-1">
                        <Text className="text-[11px] font-bold text-slate-700">
                          {msg.senderName}
                        </Text>
                        <View
                          className={`px-1.5 py-0.2 rounded-md ${
                            msg.senderRole === 'teacher'
                              ? 'bg-blue-100 border border-blue-200'
                              : 'bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          <Text
                            className={`text-[9px] font-bold ${
                              msg.senderRole === 'teacher' ? 'text-blue-800' : 'text-emerald-800'
                            }`}
                          >
                            {msg.senderRole === 'teacher' ? 'Faculty' : 'Student'}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Chat Bubble Container */}
                    <TouchableOpacity
                      activeOpacity={0.92}
                      onLongPress={() => handlePin(msg)}
                      className={`p-3.5 rounded-3xl shadow-xs ${
                        isMine
                          ? 'bg-blue-600 rounded-br-sm'
                          : 'bg-white border border-slate-200/90 rounded-bl-sm'
                      }`}
                    >
                      {/* Attachment Rendering */}
                      {msg.attachmentName && (
                        <View
                          className={`p-2.5 rounded-2xl mb-2 flex-row items-center gap-2 ${
                            isMine ? 'bg-white/20' : 'bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <View
                            className={`w-9 h-9 rounded-xl items-center justify-center ${
                              msg.attachmentType === 'pdf' ? 'bg-rose-100' : 'bg-blue-100'
                            }`}
                          >
                            <FileText
                              size={18}
                              color={msg.attachmentType === 'pdf' ? '#e11d48' : '#2563eb'}
                            />
                          </View>
                          <View className="flex-1">
                            <Text
                              className={`text-xs font-bold ${
                                isMine ? 'text-white' : 'text-slate-800'
                              }`}
                              numberOfLines={1}
                            >
                              {msg.attachmentName}
                            </Text>
                            <Text
                              className={`text-[10px] ${
                                isMine ? 'text-white/80' : 'text-slate-500'
                              }`}
                            >
                              {msg.attachmentType?.toUpperCase()} • {msg.attachmentSize || '1.4 MB'}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Message Text */}
                      {msg.text ? (
                        <Text
                          className={`text-xs leading-relaxed ${
                            isMine ? 'text-white font-medium' : 'text-slate-800 font-medium'
                          }`}
                        >
                          {msg.text}
                        </Text>
                      ) : null}

                      {/* Timestamp & Teacher Pin Action */}
                      <View className="flex-row items-center justify-end gap-1.5 mt-1.5">
                        <Text
                          className={`text-[9px] ${
                            isMine ? 'text-white/70' : 'text-slate-400'
                          }`}
                        >
                          {msg.timeFormatted}
                        </Text>

                        {isTeacher && activeRoom?.type === 'batch_group' && (
                          <TouchableOpacity
                            onPress={() => handlePin(msg)}
                            hitSlop={8}
                            className="opacity-70"
                          >
                            <Pin size={10} color={isMine ? '#ffffff' : '#64748B'} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* ================= QUICK DOUBT CHIPS ================= */}
        <View className="py-1">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-1.5 px-1">
              {quickDoubtChips.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setInputText(chip)}
                  className="bg-white border border-slate-200 px-2.5 py-1 rounded-xl active:scale-95"
                >
                  <Text className="text-[10px] font-bold text-slate-600">{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ================= STAGED ATTACHMENT PREVIEW ================= */}
        {stagedAttachment && (
          <View className="bg-blue-50 border border-blue-200 p-2.5 rounded-2xl mb-2 flex-row items-center justify-between shadow-xs">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <FileText size={16} color="#2563EB" />
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                  {stagedAttachment.name}
                </Text>
                <Text className="text-[10px] text-slate-500">
                  {stagedAttachment.type.toUpperCase()} • {stagedAttachment.size}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setStagedAttachment(null)} className="p-1">
              <X size={14} color="#2563EB" />
            </TouchableOpacity>
          </View>
        )}

        {/* ================= CHAT INPUT DOCK ================= */}
        <View className="bg-white border border-slate-200/90 rounded-3xl p-2 flex-row items-center gap-2 shadow-xs mb-2">
          {/* Attachment Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handlePickAttachment}
            className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 items-center justify-center active:scale-95"
          >
            <Paperclip size={18} color="#64748B" />
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            placeholder={
              isTeacher
                ? 'Send message or announcement to batch...'
                : 'Ask doubt or message teacher...'
            }
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            className="flex-1 max-h-24 text-xs font-bold text-slate-800 px-2 py-1"
          />

          {/* Send Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSend}
            disabled={!inputText.trim() && !stagedAttachment}
            className={`w-10 h-10 rounded-2xl items-center justify-center shadow-xs active:scale-95 ${
              inputText.trim() || stagedAttachment ? 'bg-blue-600' : 'bg-slate-100'
            }`}
          >
            <Send
              size={16}
              color={inputText.trim() || stagedAttachment ? '#ffffff' : '#94a3b8'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
