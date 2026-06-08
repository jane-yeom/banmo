'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { initFirebase, requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';
import apiClient from '@/lib/axios';
import toast from 'react-hot-toast';

export function useFCM() {
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn) return;

    let cleanup: (() => void) | undefined;

    const setup = async () => {
      try {
        initFirebase();

        const token = await requestNotificationPermission();
        if (token) {
          await apiClient.post('/notifications/fcm-token', { token }).catch(() => {});
        }

        cleanup = onForegroundMessage((payload) => {
          const title = payload.notification?.title;
          const body = payload.notification?.body ?? '';
          if (title) {
            toast(`${title}\n${body}`, {
              icon: '🔔',
              duration: 5000,
              style: {
                background: '#1C1C1C',
                color: 'white',
                borderRadius: '12px',
                fontSize: '14px',
                padding: '12px 16px',
                whiteSpace: 'pre-line',
              },
            });
          }
        });
      } catch (e) {
        console.warn('[FCM] 설정 실패:', e);
      }
    };

    setup();

    return () => {
      cleanup?.();
    };
  }, [isLoggedIn]);
}
