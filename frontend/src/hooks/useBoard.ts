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
  commentCount: number;
  tags: string[];
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

export function useBoardPosts(params?: {
  type?: string;
  tag?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<{ data: BoardPost[]; total: number; page: number; limit: number }>({
    queryKey: ['board', params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.type) p.set('type', params.type);
      if (params?.tag) p.set('tag', params.tag);
      if (params?.sort) p.set('sort', params.sort);
      if (params?.page) p.set('page', String(params.page));
      if (params?.limit) p.set('limit', String(params.limit));
      const res = await apiClient.get(`/board?${p.toString()}`);
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
    mutationFn: (data: {
      type: string;
      title: string;
      content: string;
      isAnonymous?: boolean;
      tags?: string[];
    }) => apiClient.post('/board', data),
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
