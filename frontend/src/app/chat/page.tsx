'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import SubHeader from '@/components/layout/SubHeader';
import BottomNav from '@/components/layout/BottomNav';
import { useChatRooms } from '@/hooks/useChat';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { getSocket } from '@/lib/socket';
import { ChatRoom } from '@/types';
import NoteGradeBadge from '@/components/common/NoteGradeBadge';

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function ChatListPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { data: rooms, isLoading } = useChatRooms();
  const { setUnreadCount } = useChatStore();
  const qc = useQueryClient();

  // Zustand persist는 첫 렌더 후 비동기로 localStorage에서 rehydrate.
  // mounted 체크 없이 바로 !user 판단하면 항상 로그인 페이지로 튕김.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user) { router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`); return; }
  }, [mounted, user, router]);

  // 소켓 연결 + roomUpdated 이벤트로 목록 갱신
  useEffect(() => {
    if (!accessToken) return;

    const socket = getSocket(accessToken);

    const handleRoomUpdated = () => {
      qc.invalidateQueries({ queryKey: ['chatRooms'] });
    };

    socket.on('roomUpdated', handleRoomUpdated);
    return () => { socket.off('roomUpdated', handleRoomUpdated); };
  }, [accessToken, qc]);

  // 상대방 메시지가 안읽힌 방 수 계산 → 전역 스토어
  useEffect(() => {
    if (!rooms || !user) return;
    const count = rooms.filter((r) => !r.isRead && r.lastSenderId !== user.id).length;
    setUnreadCount(count);
  }, [rooms, user, setUnreadCount]);

  const getOtherUser = (room: ChatRoom) =>
    room.sender.id === user?.id ? room.receiver : room.sender;

  const sortedRooms = rooms
    ? [...rooms].sort((a, b) =>
        new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()
      )
    : [];

  return (
    <>
    <SubHeader title="채팅" />
    <div className="mx-auto max-w-2xl px-0 sm:px-4 py-4">

      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 bg-white px-4 py-3">
              <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <span className="text-5xl mb-3">💬</span>
          <p>채팅 내역이 없습니다.</p>
          <Link href="/jobs" className="mt-4 text-indigo-600 hover:underline text-sm">
            공고 보러가기 →
          </Link>
        </div>
      ) : (
        <div className="bg-white divide-y divide-gray-100 sm:rounded-2xl sm:border sm:border-gray-100 sm:shadow-sm overflow-hidden">
          {sortedRooms.map((room) => {
            const other = getOtherUser(room);
            // 상대방이 보낸 마지막 메시지를 내가 아직 안 읽은 경우만 N 표시
            const isUnread = !room.isRead && room.lastSenderId !== user?.id;
            return (
              <Link
                key={room.id}
                href={`/chat/${room.id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                {/* 상대방 아바타 */}
                <div className="relative flex-shrink-0">
                  {other.profileImage ? (
                    <Image
                      src={other.profileImage}
                      alt={other.nickname ?? '?'}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-lg">
                      {(other.nickname ?? '?')[0]}
                    </div>
                  )}
                  {isUnread && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isUnread ? 'text-indigo-700' : 'text-gray-900'}`}>
                        {other.nickname ?? '익명'}
                      </p>
                      <NoteGradeBadge grade={other.noteGrade} showLabel={false} size="sm" />
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(room.lastMessageAt)}
                    </p>
                  </div>

                  {/* 연결된 공고 */}
                  {(room as any).post?.title && (
                    <p className="text-xs text-indigo-500 truncate mb-0.5">
                      📋 {(room as any).post.title}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${isUnread ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                      {room.lastMessage ?? '대화를 시작하세요'}
                    </p>
                    {isUnread && (
                      <span className="ml-2 h-5 min-w-5 rounded-full bg-red-500 flex items-center justify-center text-xs text-white font-bold px-1.5 flex-shrink-0">
                        N
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
      <BottomNav />
    </>
  );
}
