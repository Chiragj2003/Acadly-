import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FileText, Pin } from 'lucide-react-native';
import { ChatMessage, ChatRoom } from '@/context/ChatContext';

interface ChatMessageItemProps {
  message: ChatMessage;
  isMine: boolean;
  isTeacher: boolean;
  activeRoom?: ChatRoom;
  onPin: (msg: ChatMessage) => void;
}

export const ChatMessageItem = React.memo(function ChatMessageItem({
  message,
  isMine,
  isTeacher,
  activeRoom,
  onPin,
}: ChatMessageItemProps) {
  return (
    <View
      className={`flex-row ${isMine ? 'justify-end' : 'justify-start'} items-end gap-1.5 mb-2.5`}
    >
      {!isMine && (
        <View className="w-8 h-8 rounded-full bg-white border border-slate-200 items-center justify-center shadow-xs mb-1">
          <Text className="text-xs">{message.senderAvatarEmoji}</Text>
        </View>
      )}

      <View className="max-w-[80%]">
        {!isMine && activeRoom?.type === 'batch_group' && (
          <View className="flex-row items-center gap-1.5 mb-1 px-1">
            <Text className="text-[11px] font-bold text-slate-700">
              {message.senderName}
            </Text>
            <View
              className={`px-1.5 py-0.2 rounded-md ${
                message.senderRole === 'teacher'
                  ? 'bg-blue-100 border border-blue-200'
                  : 'bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Text
                className={`text-[9px] font-bold ${
                  message.senderRole === 'teacher' ? 'text-blue-800' : 'text-emerald-800'
                }`}
              >
                {message.senderRole === 'teacher' ? 'Faculty' : 'Student'}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.92}
          onLongPress={() => onPin(message)}
          className={`p-3.5 rounded-3xl shadow-xs ${
            isMine
              ? 'bg-blue-600 rounded-br-sm'
              : 'bg-white border border-slate-200/90 rounded-bl-sm'
          }`}
        >
          {message.attachmentName && (
            <View
              className={`p-2.5 rounded-2xl mb-2 flex-row items-center gap-2 ${
                isMine ? 'bg-white/20' : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <View
                className={`w-9 h-9 rounded-xl items-center justify-center ${
                  message.attachmentType === 'pdf' ? 'bg-rose-100' : 'bg-blue-100'
                }`}
              >
                <FileText
                  size={18}
                  color={message.attachmentType === 'pdf' ? '#e11d48' : '#2563eb'}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-xs font-bold ${
                    isMine ? 'text-white' : 'text-slate-800'
                  }`}
                  numberOfLines={1}
                >
                  {message.attachmentName}
                </Text>
                <Text
                  className={`text-[10px] ${
                    isMine ? 'text-white/80' : 'text-slate-500'
                  }`}
                >
                  {message.attachmentType?.toUpperCase()} • {message.attachmentSize || '1.4 MB'}
                </Text>
              </View>
            </View>
          )}

          {message.text ? (
            <Text
              className={`text-xs leading-relaxed ${
                isMine ? 'text-white font-medium' : 'text-slate-800 font-medium'
              }`}
            >
              {message.text}
            </Text>
          ) : null}

          <View className="flex-row items-center justify-end gap-1.5 mt-1.5">
            <Text
              className={`text-[9px] font-medium ${
                isMine ? 'text-white/80' : 'text-slate-500'
              }`}
            >
              {message.timeFormatted}
            </Text>

            {isTeacher && activeRoom?.type === 'batch_group' && (
              <TouchableOpacity
                onPress={() => onPin(message)}
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
});
