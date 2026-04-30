'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';

export interface BoardPost {
  id: string;
  type: 'FREE' | 'ANONYMOUS' | 'NOTICE';
  title: string;
  content: string;
  authorId: string;
  isAnonymous: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    nickname: string | null;
    profileImage: string | null;
    noteGrade: string;
    trustScore: number;
  };
}

export interface BoardComment {
  id: string;
  boardId: string;
  authorId: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
  author: {
    id: string;
    nickname: string | null;
    profileImage: string | null;
  };
}

export function useBoardPosts(type?: string) {
  return useQuery<BoardPost[]>({
    queryKey: ['board', type],
    queryFn: async () => {
      const params = type ? { type } : {};
      const res = await apiClient.get('/board', { params });
      return res.data;
    },
  });
}

export function useBoardPost(id: string) {
  return useQuery<{ board: BoardPost; comments: BoardComment[] }>({
    queryKey: ['board', id],
    queryFn: async () => {
      const res = await apiClient.get(`/board/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateBoardPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; title: string; content: string }) =>
      apiClient.post('/board', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board'] }),
  });
}

export function useDeleteBoardPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/board/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board'] }),
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, content }: { boardId: string; content: string }) =>
      apiClient.post(`/board/${boardId}/comments`, { content }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['board', vars.boardId] }),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, commentId }: { boardId: string; commentId: string }) =>
      apiClient.delete(`/board/${boardId}/comments/${commentId}`),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['board', vars.boardId] }),
  });
}
