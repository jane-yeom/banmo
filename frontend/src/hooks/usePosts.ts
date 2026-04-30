'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Post } from '@/types';

interface PostFilter {
  category?: string;
  instrument?: string;
  region?: string;
  payMin?: number;
  payMax?: number;
  page?: number;
  limit?: number;
}

export function usePosts(filter: PostFilter = {}) {
  return useQuery({
    queryKey: ['posts', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      const { data } = await apiClient.get<{ items: Post[]; total: number }>(
        `/posts?${params.toString()}`,
      );
      return data;
    },
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Post>(`/posts/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation<Post, Error, Partial<Post>>({
    mutationFn: (dto) => apiClient.post<Post>('/posts', dto).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/posts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}
