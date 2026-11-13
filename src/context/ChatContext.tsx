import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import { sendChatMessage, togglePinMessage } from '@/services/chatService';
import { generateUUID } from '@/lib/uuid';

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
  failed?: boolean;
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

const INITIAL_ROOMS: ChatRoom[] = [];
const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userRole } = useAuth();
  const { teacherProfile } = useUI();

  const [rooms, setRooms] = useState<ChatRoom[]>(INITIAL_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);

  // Single persistent active Realtime channel reference per room
  const channelRef = useRef<any>(null);
  const activeSubscriptionRoomIdRef = useRef<string | null>(null);

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

  // Supabase Realtime Subscription per active room (Depends ONLY on activeRoomId)
  useEffect(() => {
    if (!activeRoomId) return;

    // If channel is already subscribed to this room, reuse it without teardown
    if (activeSubscriptionRoomIdRef.current === activeRoomId && channelRef.current) {
      return;
    }

    // Clean up previous channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    activeSubscriptionRoomIdRef.current = activeRoomId;
    // Subscribe to postgres_changes filtered by active room_id (RLS enforced on server)
    const channel = supabase
      .channel(`room_${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoomId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row && row.id) {
            const incomingMsg: ChatMessage = {
              id: row.id,
              roomId: row.room_id || activeRoomId,
              senderId: row.sender_id || '',
              senderName: row.sender_name || (row.sender_role === 'teacher' ? 'Faculty Mentor' : 'Student'),
              senderRole: row.sender_role || 'student',
              senderAvatarEmoji: row.sender_role === 'teacher' ? '👨‍🏫' : '🌸',
              text: row.text || row.message_text || '',
              createdAt: row.created_at || new Date().toISOString(),
              timeFormatted: new Date(row.created_at || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              attachmentName: row.attachment_name,
              attachmentType: row.attachment_type,
              isPinned: row.is_pinned || false,
            };
            setMessagesMap((prev) => {
              const list = prev[activeRoomId] || [];
              // De-duplicate by message id
              if (list.some((m) => m.id === incomingMsg.id)) return prev;
              return { ...prev, [activeRoomId]: [...list, incomingMsg] };
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoomId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row && row.id) {
            setMessagesMap((prev) => {
              const list = prev[activeRoomId] || [];
              return {
                ...prev,
                [activeRoomId]: list.map((m) =>
                  m.id === row.id ? { ...m, isPinned: row.is_pinned || false } : m
                ),
              };
            });
            if (row.is_pinned) {
              setRooms((prev) =>
                prev.map((r) =>
                  r.id === activeRoomId
                    ? {
                        ...r,
                        pinnedMessage: {
                          id: row.id,
                          roomId: row.room_id,
                          senderId: row.sender_id,
                          senderName: row.sender_name,
                          senderRole: row.sender_role,
                          senderAvatarEmoji: row.sender_role === 'teacher' ? '👨‍🏫' : '🌸',
                          text: row.text || row.message_text || '',
                          createdAt: row.created_at,
                          timeFormatted: new Date(row.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                          isPinned: true,
                        },
                      }
                    : r
                )
              );
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        activeSubscriptionRoomIdRef.current = null;
      }
    };
  }, [activeRoomId]);

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

    const msgId = generateUUID();
    const newMsg: ChatMessage = {
      id: msgId,
      roomId: activeRoomId,
      senderId: user?.id || '',
      senderName: isTeacher ? (teacherProfile?.fullName || user?.full_name || 'Faculty Mentor') : (user?.full_name || 'Student'),
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

    // Update local state optimistically (with de-duplicating ID)
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

    // Persist to Postgres via chat_messages table (RLS automatically restricts and emits to authorized subscribers)
    try {
      if (isSupabaseConfigured && activeRoomId.includes('-') && activeRoomId.length === 36) {
        await sendChatMessage({
          roomId: activeRoomId,
          senderId: user?.id || '',
          senderName: newMsg.senderName,
          senderRole: isTeacher ? 'teacher' : 'student',
          text: newMsg.text,
          attachmentUrl: attachment?.uri,
          attachmentName: attachment?.name,
        });
      }
    } catch (err) {
      console.warn('Realtime message persist warning (using local state):', err);
      // Mark failed for retry
      setMessagesMap((prev) => {
        const list = prev[activeRoomId] || [];
        return {
          ...prev,
          [activeRoomId]: list.map((m) => (m.id === newMsg.id ? { ...m, failed: true } : m)),
        };
      });
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

    // Persist pin to Postgres
    try {
      if (isSupabaseConfigured && messageId.includes('-') && messageId.length === 36 && user?.id) {
        await togglePinMessage(messageId, true, user.id);
      }
    } catch (err) {
      console.warn('Could not persist message pin:', err);
    }
  };

  // Unpin Message (Teacher only action)
  const unpinMessage = async (roomId: string) => {
    const currentPinned = rooms.find((r) => r.id === roomId)?.pinnedMessage;

    const updatedRooms = rooms.map((r) => {
      if (r.id === roomId) {
        return { ...r, pinnedMessage: undefined };
      }
      return r;
    });

    setRooms(updatedRooms);
    await persistState(updatedRooms, messagesMap);

    // Persist unpin to Postgres
    try {
      if (isSupabaseConfigured && currentPinned?.id && user?.id) {
        await togglePinMessage(currentPinned.id, false, user.id);
      }
    } catch (err) {
      console.warn('Could not persist unpin message:', err);
    }
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

    const newId = generateUUID();
    const newRoom: ChatRoom = {
      id: newId,
      title: targetName,
      subtitle: `${targetRole === 'teacher' ? 'Faculty Mentor' : 'Student'} • Direct 1-on-1`,
      type: 'direct',
      participantIds: [user?.id || '', targetId],
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
