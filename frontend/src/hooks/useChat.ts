'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { ChatRoom, ChatMessage } from '@/types';

export function useChatRooms() {
  return useQuery({
    queryKey: ['chatRooms'],
    queryFn: async () => {
      const { data } = await apiClient.get<ChatRoom[]>('/chat/rooms');
      return data;
    },
  });
}

export function useChatMessages(roomId: string) {
  return useQuery({
    queryKey: ['chatMessages', roomId],
    queryFn: async () => {
      const { data } = await apiClient.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages`);
      return data;
    },
    enabled: !!roomId,
  });
}

export function useCreateChatRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { receiverId: string; postId?: string }) =>
      apiClient.post<ChatRoom>('/chat/rooms', dto).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chatRooms'] }),
  });
}
