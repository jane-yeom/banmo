import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';

// ─── 타입 정의 ──────────────────────────────────────────────────

export interface AdminStats {
  users: { total: number; today: number; thisMonth: number; banned: number };
  posts: { total: number; today: number; active: number; hidden: number };
  boards: { total: number; today: number };
  reports: { total: number; pending: number };
  qna: { total: number; pending: number };
  payments: { total: number; totalAmount: number; thisMonth: number };
}

export interface AdminUser {
  id: string;
  nickname: string | null;
  email: string | null;
  noteGrade: string;
  trustScore: number;
  isBanned: boolean;
  banReason: string | null;
  loginType: string;
  role: string;
  createdAt: string;
  postCount?: number;
}

export interface AdminPost {
  id: string;
  title: string;
  category: string;
  author: { id: string; nickname: string | null } | null;
  payType: string;
  payMin: number;
  status: string;
  isPremium: boolean;
  viewCount: number;
  createdAt: string;
}

export interface AdminBoard {
  id: string;
  title: string;
  type: string;
  author: { id: string; nickname: string | null } | null;
  isAnonymous: boolean;
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

export interface AdminReport {
  id: string;
  reporter: { id: string; nickname: string | null } | null;
  targetType: string;
  targetId: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
}

export interface AdminQna {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  author: { id: string; nickname: string | null } | null;
  authorName: string | null;
  authorEmail: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
}

export interface AdminPayment {
  id: string;
  user: { id: string; nickname: string | null } | null;
  post: { id: string; title: string } | null;
  orderId: string;
  amount: number;
  type: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── 훅 ─────────────────────────────────────────────────────────

export function useAdminStats() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiClient.get<AdminStats>('/admin/stats').then((r) => r.data),
    refetchInterval: 30_000,
  });
  return { data, loading: isLoading, error, refetch };
}

export function useAdminUsers(filters: {
  page: number;
  limit?: number;
  search?: string;
  grade?: string;
  isBanned?: string;
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<AdminUser>>('/admin/users', { params: filters })
        .then((r) => r.data),
  });
  return { data, loading: isLoading, error, refetch };
}

export function useAdminPosts(filters: {
  page: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  isPremium?: string;
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'posts', filters],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<AdminPost>>('/admin/posts', { params: filters })
        .then((r) => r.data),
  });
  return { data, loading: isLoading, error, refetch };
}

export function useAdminBoards(filters: {
  page: number;
  limit?: number;
  search?: string;
  type?: string;
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'boards', filters],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<AdminBoard>>('/admin/boards', { params: filters })
        .then((r) => r.data),
  });
  return { data, loading: isLoading, error, refetch };
}

export function useAdminReports(filters: {
  page: number;
  limit?: number;
  status?: string;
  targetType?: string;
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'reports', filters],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<AdminReport>>('/admin/reports', { params: filters })
        .then((r) => r.data),
  });
  return { data, loading: isLoading, error, refetch };
}

export function useAdminQna(filters: {
  page: number;
  limit?: number;
  status?: string;
  category?: string;
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'qna', filters],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<AdminQna>>('/admin/qna', { params: filters })
        .then((r) => r.data),
  });
  return { data, loading: isLoading, error, refetch };
}

export function useAdminPayments(filters: {
  page: number;
  limit?: number;
  status?: string;
  type?: string;
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'payments', filters],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<AdminPayment>>('/admin/payments', { params: filters })
        .then((r) => r.data),
  });
  return { data, loading: isLoading, error, refetch };
}
