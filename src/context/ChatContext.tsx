import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useAcademic } from './AcademicContext';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student';
  senderAvatarEmoji: string;
  text: string;
  createdAt: string;
  timeFormatted: string;
  attachmentName?: string;
  attachmentUri?: string;
  attachmentType?: 'image' | 'pdf';
  attachmentSize?: string;
  isPinned?: boolean;
}

export interface ChatRoom {
  id: string;
  title: string;
  subtitle: string;
  type: 'batch_group' | 'direct';
  batchId?: string;
  participantIds: string[];
  avatarEmoji: string;
  pinnedMessage?: ChatMessage;
  unreadCount: number;
  lastMessage?: {
    text: string;
    senderName: string;
    timeFormatted: string;
  };
}

export interface ChatContextType {
  rooms: ChatRoom[];
  activeRoomId: string;
  setActiveRoomId: (roomId: string) => void;
  activeRoom: ChatRoom | undefined;
  messages: ChatMessage[];
  totalUnreadCount: number;
  sendMessage: (text: string, attachment?: { name: string; uri: string; type: 'image' | 'pdf'; size?: string }) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  unpinMessage: (roomId: string) => Promise<void>;
  markRoomAsRead: (roomId: string) => void;
  createNewDirectChat: (targetName: string, targetRole: 'teacher' | 'student', targetId: string) => string;
}

const STORAGE_KEY_ROOMS = '@acadly_chat_rooms_v1';
const STORAGE_KEY_MESSAGES = '@acadly_chat_messages_v1';

const INITIAL_ROOMS: ChatRoom[] = [
  {
    id: 'room-batch-sakura',
    title: 'Batch Sakura 🌸 (Group Chat)',
    subtitle: 'Class 11 Science • 28 Verified Students',
    type: 'batch_group',
    batchId: 'batch-01',
    participantIds: ['prof-vikram', 'stud-amelia', 'stud-kabir', 'stud-rohan'],
    avatarEmoji: '🌸',
    unreadCount: 1,
    lastMessage: {
      text: 'Remember to solve DPP #14 before 08:00 PM today!',
      senderName: 'Prof. Vikram Joshi',
      timeFormatted: '04:15 PM',
    },
    pinnedMessage: {
      id: 'pin-01',
      roomId: 'room-batch-sakura',
      senderId: 'prof-vikram',
      senderName: 'Prof. Vikram Joshi ⚡',
      senderRole: 'teacher',
      senderAvatarEmoji: '👨‍🏫',
      text: '📌 Announcement: Physics Masterclass on Rotational Dynamics is live at 04:30 PM. Keep your formula cheat-sheets ready!',
      createdAt: new Date().toISOString(),
      timeFormatted: '02:00 PM',
      isPinned: true,
    },
  },
  {
    id: 'direct-vikram-amelia',
    title: 'Prof. Vikram Joshi ⚡',
    subtitle: 'Faculty 1-on-1 • Physics & Math Mentor',
    type: 'direct',
    participantIds: ['prof-vikram', 'stud-amelia'],
    avatarEmoji: '👨‍🏫',
    unreadCount: 0,
    lastMessage: {
      text: 'Great work on the previous mock test! Let me know if you need help with the calculus proof.',
      senderName: 'Prof. Vikram Joshi',
      timeFormatted: 'Yesterday',
    },
  },
  {
    id: 'direct-teacher-kabir',
    title: 'Kabir Singhania (Student)',
    subtitle: 'Class 11 Science • Roll #08',
    type: 'direct',
    participantIds: ['prof-vikram', 'stud-kabir'],
    avatarEmoji: '🌱',
    unreadCount: 1,
    lastMessage: {
      text: 'Sir, which reference book should I solve for Rotational Mechanics?',
      senderName: 'Kabir Singhania',
      timeFormatted: '11:20 AM',
    },
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'room-batch-sakura': [
    {
      id: 'msg-s1',
      roomId: 'room-batch-sakura',
      senderId: 'prof-vikram',
      senderName: 'Prof. Vikram Joshi ⚡',
      senderRole: 'teacher',
      senderAvatarEmoji: '👨‍🏫',
      text: 'Good afternoon Batch Sakura! 🌸 Today we will cover Rotational Kinematics and moment of inertia for composite geometries.',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      timeFormatted: '01:30 PM',
    },
    {
      id: 'msg-s2',
      roomId: 'room-batch-sakura',
      senderId: 'stud-amelia',
      senderName: 'Amelia Sharma',
      senderRole: 'student',
      senderAvatarEmoji: '🌸',
      text: 'Sir, I had a doubt regarding perpendicular axis theorem for 3D cylinders. Can it only be applied to planar laminas?',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      timeFormatted: '02:15 PM',
    },
    {
      id: 'msg-s3',
      roomId: 'room-batch-sakura',
      senderId: 'prof-vikram',
      senderName: 'Prof. Vikram Joshi ⚡',
      senderRole: 'teacher',
      senderAvatarEmoji: '👨‍🏫',
      text: 'Exactly right, Amelia! The perpendicular axis theorem Iz = Ix + Iy is strictly valid for 2D flat bodies (laminas in the x-y plane). For 3D cylinders, you must use volume integration or parallel axis theorem.',
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      timeFormatted: '02:45 PM',
    },
    {
      id: 'msg-s4',
      roomId: 'room-batch-sakura',
      senderId: 'stud-rohan',
      senderName: 'Rohan Mehra',
      senderRole: 'student',
      senderAvatarEmoji: '🚀',
      text: 'Got it! Solved Question 4 with this trick and got option B.',
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      timeFormatted: '03:10 PM',
    },
    {
      id: 'msg-s5',
      roomId: 'room-batch-sakura',
      senderId: 'prof-vikram',
      senderName: 'Prof. Vikram Joshi ⚡',
      senderRole: 'teacher',
      senderAvatarEmoji: '👨‍🏫',
      text: 'Remember to solve DPP #14 before 08:00 PM today!',
      createdAt: new Date(Date.now() - 900000).toISOString(),
      timeFormatted: '04:15 PM',
    },
  ],
  'direct-vikram-amelia': [
    {
      id: 'msg-d1',
      roomId: 'direct-vikram-amelia',
      senderId: 'stud-amelia',
      senderName: 'Amelia Sharma',
      senderRole: 'student',
      senderAvatarEmoji: '🌸',
      text: 'Sir, I have submitted my assignment for Definite Integrals. Could you check my step in question 2?',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      timeFormatted: 'Yesterday',
      attachmentName: 'Calculus_Solution_Page2.pdf',
      attachmentType: 'pdf',
      attachmentSize: '1.4 MB',
    },
    {
      id: 'msg-d2',
      roomId: 'direct-vikram-amelia',
      senderId: 'prof-vikram',
      senderName: 'Prof. Vikram Joshi ⚡',
      senderRole: 'teacher',
      senderAvatarEmoji: '👨‍🏫',
      text: 'Great work on the previous mock test! Let me know if you need help with the calculus proof.',
      createdAt: new Date(Date.now() - 80000000).toISOString(),
      timeFormatted: 'Yesterday',
    },
  ],
  'direct-teacher-kabir': [
    {
      id: 'msg-k1',
      roomId: 'direct-teacher-kabir',
      senderId: 'stud-kabir',
      senderName: 'Kabir Singhania',
      senderRole: 'student',
      senderAvatarEmoji: '🌱',
      text: 'Sir, which reference book should I solve for Rotational Mechanics?',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      timeFormatted: '11:20 AM',
    },
  ],
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userRole } = useAuth();
  const { teacherProfile } = useAcademic();

  const [rooms, setRooms] = useState<ChatRoom[]>(INITIAL_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState<string>('room-batch-sakura');
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);

  // Load persisted rooms & messages from AsyncStorage
  useEffect(() => {
    const loadPersistedChat = async () => {
      try {
        const storedRooms = await AsyncStorage.getItem(STORAGE_KEY_ROOMS);
        const storedMessages = await AsyncStorage.getItem(STORAGE_KEY_MESSAGES);

        if (storedRooms) {
          setRooms(JSON.parse(storedRooms));
        }
        if (storedMessages) {
          setMessagesMap(JSON.parse(storedMessages));
        }
      } catch (err) {
        console.warn('Could not load stored chat:', err);
      }
    };
    loadPersistedChat();
  }, []);

  // Save changes to AsyncStorage
  const persistState = async (updatedRooms: ChatRoom[], updatedMessages: Record<string, ChatMessage[]>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(updatedRooms));
      await AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updatedMessages));
    } catch (err) {
      console.warn('Could not persist chat data:', err);
    }
  };

  // Supabase Realtime Subscription per active room
  useEffect(() => {
    if (!activeRoomId) return;

    // Listen to real-time broadcast events on channel
    const channel = supabase.channel(`chat_${activeRoomId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const incomingMsg: ChatMessage = payload.payload;
        if (incomingMsg && incomingMsg.roomId === activeRoomId) {
          setMessagesMap((prev) => {
            const list = prev[activeRoomId] || [];
            if (list.some((m) => m.id === incomingMsg.id)) return prev;
            const updated = { ...prev, [activeRoomId]: [...list, incomingMsg] };
            persistState(rooms, updated);
            return updated;
          });
        }
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload: any) => {
          const row = payload.new;
          if (row && (row.room_id === activeRoomId || row.roomId === activeRoomId)) {
            const incomingMsg: ChatMessage = {
              id: row.id,
              roomId: row.room_id || row.roomId,
              senderId: row.sender_id || row.senderId,
              senderName: row.sender_role === 'teacher' ? 'Prof. Vikram Joshi ⚡' : 'Student',
              senderRole: row.sender_role || 'student',
              senderAvatarEmoji: row.sender_role === 'teacher' ? '👨‍🏫' : '🌸',
              text: row.message_text || '',
              createdAt: row.created_at || new Date().toISOString(),
              timeFormatted: new Date(row.created_at || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              attachmentName: row.attachment_url ? 'Attachment.pdf' : undefined,
              attachmentType: row.attachment_type,
              isPinned: row.is_pinned || false,
            };
            setMessagesMap((prev) => {
              const list = prev[activeRoomId] || [];
              if (list.some((m) => m.id === incomingMsg.id)) return prev;
              const updated = { ...prev, [activeRoomId]: [...list, incomingMsg] };
              persistState(rooms, updated);
              return updated;
            });
          }
        }
      )
      .on('broadcast', { event: 'pin_message' }, (payload) => {
        const { messageId, roomId } = payload.payload;
        if (roomId === activeRoomId) {
          setRooms((prev) =>
            prev.map((r) => {
              if (r.id === roomId) {
                const targetMsg = (messagesMap[roomId] || []).find((m) => m.id === messageId);
                return { ...r, pinnedMessage: targetMsg };
              }
              return r;
            })
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoomId, rooms, messagesMap]);

  // Active room data
  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];
  const messages = messagesMap[activeRoomId] || [];

  // Total unread count
  const totalUnreadCount = rooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0);

  // Mark room as read
  const markRoomAsRead = (roomId: string) => {
    setRooms((prev) => {
      const updated = prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r));
      persistState(updated, messagesMap);
      return updated;
    });
  };

  // Send Message
  const sendMessage = async (
    text: string,
    attachment?: { name: string; uri: string; type: 'image' | 'pdf'; size?: string }
  ) => {
    if (!text.trim() && !attachment) return;

    const isTeacher = userRole === 'teacher';
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      roomId: activeRoomId,
      senderId: isTeacher ? 'prof-vikram' : (user?.id || 'stud-amelia'),
      senderName: isTeacher ? teacherProfile.fullName : (user?.full_name || 'Amelia Sharma 🌸'),
      senderRole: isTeacher ? 'teacher' : 'student',
      senderAvatarEmoji: isTeacher ? '👨‍🏫' : '🌸',
      text: text.trim(),
      createdAt: now.toISOString(),
      timeFormatted,
      attachmentName: attachment?.name,
      attachmentUri: attachment?.uri,
      attachmentType: attachment?.type,
      attachmentSize: attachment?.size,
    };

    // Update local state
    const currentList = messagesMap[activeRoomId] || [];
    const updatedMessages = {
      ...messagesMap,
      [activeRoomId]: [...currentList, newMsg],
    };

    const updatedRooms = rooms.map((r) => {
      if (r.id === activeRoomId) {
        return {
          ...r,
          lastMessage: {
            text: newMsg.text || `Attached: ${attachment?.name}`,
            senderName: newMsg.senderName,
            timeFormatted,
          },
        };
      }
      return r;
    });

    setMessagesMap(updatedMessages);
    setRooms(updatedRooms);
    await persistState(updatedRooms, updatedMessages);

    // Broadcast in real-time via Supabase channel
    try {
      const channel = supabase.channel(`chat_${activeRoomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: newMsg,
      });
    } catch (err) {
      console.warn('Realtime broadcast note (using local state fallback):', err);
    }
  };

  // Pin Message (Teacher only action)
  const pinMessage = async (messageId: string) => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) return;

    const updatedRooms = rooms.map((r) => {
      if (r.id === activeRoomId) {
        return {
          ...r,
          pinnedMessage: { ...targetMsg, isPinned: true },
        };
      }
      return r;
    });

    setRooms(updatedRooms);
    await persistState(updatedRooms, messagesMap);

    // Broadcast pin to all participants
    try {
      const channel = supabase.channel(`chat_${activeRoomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'pin_message',
        payload: { messageId, roomId: activeRoomId },
      });
    } catch (err) {
      console.warn('Realtime pin note:', err);
    }
  };

  // Unpin Message
  const unpinMessage = async (roomId: string) => {
    const updatedRooms = rooms.map((r) => {
      if (r.id === roomId) {
        return { ...r, pinnedMessage: undefined };
      }
      return r;
    });
    setRooms(updatedRooms);
    await persistState(updatedRooms, messagesMap);
  };

  // Create new direct chat
  const createNewDirectChat = (
    targetName: string,
    targetRole: 'teacher' | 'student',
    targetId: string
  ): string => {
    const existing = rooms.find((r) => r.type === 'direct' && r.participantIds.includes(targetId));
    if (existing) {
      setActiveRoomId(existing.id);
      return existing.id;
    }

    const newId = `direct-${Date.now()}`;
    const newRoom: ChatRoom = {
      id: newId,
      title: targetName,
      subtitle: `${targetRole === 'teacher' ? 'Faculty Mentor' : 'Student'} • Direct 1-on-1`,
      type: 'direct',
      participantIds: ['prof-vikram', targetId],
      avatarEmoji: targetRole === 'teacher' ? '👨‍🏫' : '🌱',
      unreadCount: 0,
    };

    const updatedRooms = [newRoom, ...rooms];
    setRooms(updatedRooms);
    setActiveRoomId(newId);
    persistState(updatedRooms, messagesMap);
    return newId;
  };

  return (
    <ChatContext.Provider
      value={{
        rooms,
        activeRoomId,
        setActiveRoomId,
        activeRoom,
        messages,
        totalUnreadCount,
        sendMessage,
        pinMessage,
        unpinMessage,
        markRoomAsRead,
        createNewDirectChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
