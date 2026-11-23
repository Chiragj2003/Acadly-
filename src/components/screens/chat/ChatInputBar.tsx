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
                className="bg-white h-[38px] px-3.5 rounded-full justify-center active:opacity-80"
              >
                <Text className="text-[13px] font-sans-bold text-ink">{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Staged Attachment Preview */}
      {stagedAttachment && (
        <View className="bg-blue-50 border border-blue-200 p-2.5 rounded-2xl flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1 pr-2">
            <FileText size={16} color="#1C1C1E" />
            <View className="flex-1">
              <Text className="text-xs font-sans-bold text-slate-800" numberOfLines={1}>
                {stagedAttachment.name}
              </Text>
              <Text className="text-xs text-slate-500">
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
      <View className="flex-row items-center gap-2 mb-2">
       <View
        style={{ shadowColor: '#1C1C1E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 3 }}
        className="flex-1 bg-white rounded-full pl-1.5 pr-3 min-h-[54px] flex-row items-center gap-1.5"
       >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Attach a file"
          activeOpacity={0.88}
          onPress={onPickAttachment}
          className="w-[42px] h-[42px] rounded-full items-center justify-center"
        >
          <Paperclip size={19} color="#1C1C1E" />
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
          accessibilityLabel="Message"
          className="flex-1 max-h-24 text-[15px] font-sans text-ink py-2"
        />
       </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onSend}
          disabled={!inputText.trim() && !stagedAttachment}
          accessibilityRole="button"
          accessibilityLabel="Send"
          className={`w-[54px] h-[54px] rounded-full items-center justify-center ${
            inputText.trim() || stagedAttachment ? 'bg-ink' : 'bg-white'
          }`}
        >
          <Send
            size={20}
            color={inputText.trim() || stagedAttachment ? '#ffffff' : '#8C877E'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
