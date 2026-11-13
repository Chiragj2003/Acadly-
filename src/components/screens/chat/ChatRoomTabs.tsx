import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Plus } from 'lucide-react-native';
import { ChatRoom } from '@/context/ChatContext';
import { Student360Profile } from '@/types/database';

interface ChatRoomTabsProps {
  rooms: ChatRoom[];
  activeRoomId: string;
  onSelectRoom: (roomId: string) => void;
  isTeacher: boolean;
  studentsRoster: Student360Profile[];
  onCreateDirectChat: (targetName: string, targetRole: 'teacher' | 'student', targetId: string) => void;
}

export const ChatRoomTabs: React.FC<ChatRoomTabsProps> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
  isTeacher,
  studentsRoster,
  onCreateDirectChat,
}) => {
  return (
    <View className="mb-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 px-1">
          {rooms.map((room) => {
            const isSelected = activeRoomId === room.id;
            const displayTitle =
              room.type === 'batch_group'
                ? room.title.includes(' • ')
                  ? room.title.split(' • ')[1]
                  : room.title
                : room.title.replace('Doubt Room: ', '');

            return (
              <TouchableOpacity
                key={room.id}
                onPress={() => onSelectRoom(room.id)}
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

          {isTeacher && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Start 1-on-1 Chat',
                  'Select a verified student from your batch roster:',
                  studentsRoster.map((st) => ({
                    text: `${st.name} (${st.rollNumber})`,
                    onPress: () => onCreateDirectChat(st.name, 'student', st.id),
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
  );
};
