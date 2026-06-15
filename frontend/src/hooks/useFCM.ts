'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { initFirebase, requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';
import apiClient from '@/lib/axios';

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

        // 포그라운드 메시지는 소켓 알림(useNotifications)이 토스트를 처리하므로 여기서는 무시
        cleanup = onForegroundMessage((_payload) => {
          // 앱이 포그라운드일 때 FCM 수신 → 소켓 알림이 이미 토스트 표시하므로 중복 방지
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
