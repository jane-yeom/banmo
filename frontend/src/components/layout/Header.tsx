'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import apiClient from '@/lib/axios';
import { initKakao } from '@/lib/kakao';
import { getSocket } from '@/lib/socket';
import { ChatRoom } from '@/types';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useNotifications } from '@/hooks/useNotifications';

const NAV_ITEMS = [
  { label: '구인구직', href: '/jobs' },
  { label: '공연/연습실', href: '/promo' },
  { label: '양도/중고', href: '/trade' },
  { label: '게시판', href: '/board?type=FREE' },
  { label: '고객센터', href: '/support' },
];

function NotificationsInitializer() {
  useNotifications();
  return null;
}

export default function Header() {
  const { user, isLoggedIn, setAuth, logout, accessToken } = useAuthStore();
  const { unreadCount, setUnreadCount } = useChatStore();
  const qc = useQueryClient();

  // 페이지 로드 시 localStorage 토큰으로 유저 상태 복원
  useEffect(() => {
    initKakao();

    const token = localStorage.getItem('accessToken');
    if (!token || isLoggedIn) return;

    apiClient
      .get('/auth/me')
      .then((res) => {
        setAuth(res.data, token);
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FCM 토큰 발급 + 서버 전송 (로그인 후)
  useEffect(() => {
    if (!user || !accessToken) return;

    const initFcm = async () => {
      try {
        const { requestFcmToken } = await import('@/lib/firebase');
        const token = await requestFcmToken();
        if (token) {
          await apiClient.post('/notifications/fcm-token', { token }).catch(() => {});
        }
      } catch {
        // FCM 미설정 시 무시
      }
    };
    initFcm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // 로그인 후 읽지 않은 채팅 수 로드 + 소켓 실시간 알림
  useEffect(() => {
    if (!user || !accessToken) return;

    apiClient.get<ChatRoom[]>('/chat/rooms').then(({ data }) => {
      const count = data.filter((r) => !r.isRead && r.receiver.id === user.id).length;
      setUnreadCount(count);
    }).catch(() => {});

    const socket = getSocket(accessToken);
    const handleRoomUpdated = () => {
      qc.invalidateQueries({ queryKey: ['chatRooms'] });
      apiClient.get<ChatRoom[]>('/chat/rooms').then(({ data }) => {
        const count = data.filter((r) => !r.isRead && r.receiver.id === user.id).length;
        setUnreadCount(count);
      }).catch(() => {});
    };

    socket.on('roomUpdated', handleRoomUpdated);
    return () => { socket.off('roomUpdated', handleRoomUpdated); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, accessToken]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* 알림 실시간 구독 초기화 (로그인 상태에서만) */}
      {user && <NotificationsInitializer />}

      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎵</span>
            <span className="text-xl font-bold text-violet-700">반모</span>
          </Link>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-violet-700 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 우측 영역 */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* 알림 벨 */}
                <NotificationBell />

                {/* 채팅 아이콘 + 읽지 않은 뱃지 */}
                <Link href="/chat" className="relative p-1.5 text-gray-500 hover:text-violet-700 transition-colors">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* 찜 목록 */}
                <Link href="/favorites" className="p-1.5 text-gray-500 hover:text-violet-700 transition-colors" title="찜 목록">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </Link>

                {/* 프로필 */}
                <Link href={`/profile/${user.id}`} className="flex items-center gap-2 group">
                  {user.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt={user.nickname ?? '프로필'}
                      width={32}
                      height={32}
                      className="rounded-full object-cover ring-2 ring-transparent group-hover:ring-violet-300 transition-all"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 text-sm font-bold ring-2 ring-transparent group-hover:ring-violet-300 transition-all">
                      {(user.nickname ?? '?')[0]}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-gray-700 group-hover:text-violet-700 transition-colors">
                    {user.nickname ?? '사용자'}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 transition-colors"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
