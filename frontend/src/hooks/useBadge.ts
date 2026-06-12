'use client';
import { useEffect } from 'react';
import { useChatStore } from '@/store/chat.store';
import { useNotificationStore } from '@/store/notification.store';

/**
 * 읽지 않은 채팅 + 알림 수를 합산해 앱 아이콘 배지에 표시.
 * - iOS Safari 16.4+ (홈화면 추가 PWA), Chrome/Edge 지원
 * - 지원하지 않는 브라우저에서는 조용히 무시
 */
export function useBadge() {
  const chatUnread = useChatStore((s) => s.unreadCount);
  const notifUnread = useNotificationStore((s) => s.unreadCount);

  useEffect(() => {
    const total = chatUnread + notifUnread;

    if (!('setAppBadge' in navigator)) return;

    if (total > 0) {
      navigator.setAppBadge(total).catch(() => {});
    } else {
      navigator.clearAppBadge().catch(() => {});
    }
  }, [chatUnread, notifUnread]);
}
