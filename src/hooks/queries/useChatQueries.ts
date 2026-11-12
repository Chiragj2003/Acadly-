import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getChatRooms,
  getChatMessages,
  sendChatMessage,
  togglePinMessage,
  SendMessageInput,
} from '@/services/chatService';

export const CHAT_QUERY_KEY = 'chat';

export function useChatRooms(instituteId?: string, batchId?: string) {
  return useQuery({
    queryKey: [CHAT_QUERY_KEY, 'rooms', instituteId, batchId],
    queryFn: () => getChatRooms(instituteId!, batchId),
    enabled: Boolean(instituteId),
  });
}

export function useChatMessages(roomId?: string, cursorCreatedAt?: string) {
  return useQuery({
    queryKey: [CHAT_QUERY_KEY, 'messages', roomId, cursorCreatedAt],
    queryFn: () => getChatMessages(roomId!, cursorCreatedAt),
    enabled: Boolean(roomId),
    refetchInterval: 5000, // Poll active chat every 5s if realtime websocket is quiet
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) => sendChatMessage(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [CHAT_QUERY_KEY, 'messages', variables.roomId],
      });
    },
  });
}

export function useTogglePinMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { messageId: string; isPinned: boolean; pinnedBy: string; roomId: string }) =>
      togglePinMessage(params.messageId, params.isPinned, params.pinnedBy),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [CHAT_QUERY_KEY, 'messages', variables.roomId],
      });
    },
  });
}
