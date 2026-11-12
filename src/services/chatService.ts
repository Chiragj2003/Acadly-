import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type UserRole } from '@/types/database';

export interface ChatRoomRow {
  id: string;
  institute_id: string;
  batch_id?: string;
  name: string;
  type: 'batch_group' | 'direct_doubt' | 'announcements';
  student_id?: string;
  teacher_id?: string;
  created_at: string;
  batch?: {
    name: string;
  };
}

export interface ChatMessageRow {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  sender_avatar?: string;
  text: string;
  attachment_url?: string;
  attachment_name?: string;
  is_pinned: boolean;
  pinned_by?: string;
  created_at: string;
}

export interface SendMessageInput {
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

/**
 * Fetch all chat rooms for an institute, optionally filtered by batch.
 */
export const getChatRooms = async (
  instituteId: string,
  batchId?: string
): Promise<ChatRoomRow[]> => {
  if (!isSupabaseConfigured || !instituteId) return [];

  let query = supabase
    .from('chat_rooms')
    .select(`
      *,
      batch:batches(name)
    `)
    .eq('institute_id', instituteId)
    .order('created_at', { ascending: false });

  if (batchId) {
    query = query.or(`batch_id.eq.${batchId},batch_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load chat rooms: ${error.message}`);
  }

  return (data || []) as ChatRoomRow[];
};

/**
 * Fetch chat messages for a room with cursor-based pagination (limit 30).
 */
export const getChatMessages = async (
  roomId: string,
  cursorCreatedAt?: string,
  limit = 30
): Promise<{ messages: ChatMessageRow[]; nextCursor: string | null }> => {
  if (!isSupabaseConfigured || !roomId) {
    return { messages: [], nextCursor: null };
  }

  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursorCreatedAt) {
    query = query.lt('created_at', cursorCreatedAt);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load chat messages: ${error.message}`);
  }

  const rows = (data || []) as ChatMessageRow[];
  const nextCursor = rows.length === limit ? rows[rows.length - 1].created_at : null;

  // Reverse so chronological order from oldest to newest in view
  return {
    messages: rows.slice().reverse(),
    nextCursor,
  };
};

/**
 * Send a chat message into a room.
 */
export const sendChatMessage = async (
  input: SendMessageInput
): Promise<ChatMessageRow> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const { roomId, senderId, senderName, senderRole, text, attachmentUrl, attachmentName } = input;

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: roomId,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      text: text.trim(),
      attachment_url: attachmentUrl || null,
      attachment_name: attachmentName || null,
      is_pinned: false,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return data as ChatMessageRow;
};

/**
 * Toggle pin status for important announcements.
 */
export const togglePinMessage = async (
  messageId: string,
  isPinned: boolean,
  pinnedBy: string
): Promise<{ success: boolean }> => {
  if (!isSupabaseConfigured) return { success: true };

  const { error } = await supabase
    .from('chat_messages')
    .update({
      is_pinned: isPinned,
      pinned_by: isPinned ? pinnedBy : null,
    })
    .eq('id', messageId);

  if (error) {
    throw new Error(`Failed to toggle pin: ${error.message}`);
  }

  return { success: true };
};
