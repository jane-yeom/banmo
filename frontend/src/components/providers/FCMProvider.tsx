'use client';
import { useFCM } from '@/hooks/useFCM';
import { useBadge } from '@/hooks/useBadge';

export default function FCMProvider() {
  useFCM();
  useBadge(); // 읽지 않은 채팅+알림 수를 앱 아이콘 배지에 반영
  return null;
}
