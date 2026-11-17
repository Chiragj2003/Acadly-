import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Paperclip, Send, FileText, X } from 'lucide-react-native';

interface StagedAttachment {
  name: string;
  uri: string;
  type: 'image' | 'pdf';
  size?: string;
}

interface ChatInputBarProps {
  inputText: string;
  setInputText: (text: string) => void;
  stagedAttachment: StagedAttachment | null;
  setStagedAttachment: (attachment: StagedAttachment | null) => void;
  onPickAttachment: () => void;
  onSend: () => void;
  isTeacher: boolean;
  quickChips: string[];
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  inputText,
  setInputText,
  stagedAttachment,
  setStagedAttachment,
  onPickAttachment,
  onSend,
  isTeacher,
  quickChips,
}) => {
  return (
    <View className="gap-1.5">
      {/* Quick Chips */}
      <View className="py-0.5">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-1.5 px-1">
            {quickChips.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setInputText(chip)}
                className="bg-white border border-slate-200 px-2.5 py-1 rounded-xl active:scale-95"
              >
                <Text className="text-[10px] font-sans-bold text-slate-600">{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Staged Attachment Preview */}
      {stagedAttachment && (
        <View className="bg-blue-50 border border-blue-200 p-2.5 rounded-2xl flex-row items-center justify-between shadow-xs">
          <View className="flex-row items-center gap-2 flex-1 pr-2">
            <FileText size={16} color="#1C1C1E" />
            <View className="flex-1">
              <Text className="text-xs font-sans-bold text-slate-800" numberOfLines={1}>
                {stagedAttachment.name}
              </Text>
              <Text className="text-[10px] text-slate-500">
                {stagedAttachment.type.toUpperCase()} • {stagedAttachment.size}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setStagedAttachment(null)} className="p-1">
            <X size={14} color="#1C1C1E" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Dock */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-2 flex-row items-center gap-2 shadow-xs mb-2">
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onPickAttachment}
          className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 items-center justify-center active:scale-95"
        >
          <Paperclip size={18} color="#6E6A63" />
        </TouchableOpacity>

        <TextInput
          placeholder={
            isTeacher
              ? 'Send message or announcement to batch...'
              : 'Ask doubt or message teacher...'
          }
          placeholderTextColor="#8C877E"
          value={inputText}
          onChangeText={setInputText}
          multiline
          className="flex-1 max-h-24 text-xs font-sans-bold text-slate-800 px-2 py-1"
        />

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onSend}
          disabled={!inputText.trim() && !stagedAttachment}
          className={`w-10 h-10 rounded-2xl items-center justify-center shadow-xs active:scale-95 ${
            inputText.trim() || stagedAttachment ? 'bg-blue-600' : 'bg-slate-100'
          }`}
        >
          <Send
            size={16}
            color={inputText.trim() || stagedAttachment ? '#ffffff' : '#8C877E'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
