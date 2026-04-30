'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '@/lib/axios';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore, AppNotification } from '@/store/notification.store';

const TYPE_ICON: Record<string, string> = {
  CHAT_MESSAGE: '💬',
  APPLICATION: '📝',
  APPLICATION_STATUS: '🎉',
  KEYWORD: '🔍',
  COMMENT: '💭',
  FAVORITE_POST: '⭐',
  SYSTEM: '🔔',
  NOTICE: '📢',
};

export function useNotifications() {
  const { user, accessToken } = useAuthStore();
  const { setNotifications, addNotification } = useNotificationStore();
  const qc = useQueryClient();

  // 초기 알림 로드
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get<{
        notifications: AppNotification[];
        unreadCount: number;
      }>('/notifications');
      return res.data;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) {
      setNotifications(data.notifications, data.unreadCount);
    }
  }, [data, setNotifications]);

  // Socket.io 실시간 알림 수신
  useEffect(() => {
    if (!accessToken || !user) return;

    const socket = getSocket(accessToken);

    const handleNotification = (notification: AppNotification) => {
      addNotification(notification);
      qc.invalidateQueries({ queryKey: ['notifications'] });

      // 토스트 알림 표시
      const icon = TYPE_ICON[notification.type] ?? '🔔';
      toast(`${icon} ${notification.title}\n${notification.body}`, {
        duration: 3000,
        style: {
          background: '#f5f3ff',
          color: '#5b21b6',
          border: '1px solid #ede9fe',
          fontSize: '13px',
          maxWidth: '320px',
        },
      });
    };

    socket.on('notification', handleNotification);
    return () => { socket.off('notification', handleNotification); };
  }, [accessToken, user, addNotification, qc]);
}

export function useMarkAsRead() {
  const { markAsRead } = useNotificationStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onMutate: (id) => markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllAsRead() {
  const { markAllAsRead } = useNotificationStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all'),
    onMutate: () => markAllAsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export { TYPE_ICON };
