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
  const { user, accessToken, isRestoring } = useAuthStore();
  const { data: rooms, isLoading } = useChatRooms();
  const { setUnreadCount } = useChatStore();
  const qc = useQueryClient();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // auth 복원 완료(isRestoring=false) 후에만 로그인 여부 판단
  useEffect(() => {
    if (!mounted || isRestoring) return;
    if (!user) { router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`); return; }
  }, [mounted, isRestoring, user, router]);

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
          <Link href="/jobs" className="mt-4 text-[#1C1C1C] hover:underline text-sm">
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
                <div style={{ position: 'relative', flexShrink: 0, width: 48, height: 48 }}>
                  {other.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={other.profileImage}
                      alt={other.nickname ?? '?'}
                      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F0EDE6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C1C1C', fontWeight: 700, fontSize: 18 }}>
                      {(other.nickname ?? '?')[0]}
                    </div>
                  )}
                  {isUnread && (
                    <span style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#EF4444', border: '2px solid white', display: 'block' }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isUnread ? 'text-[#1C1C1C]' : 'text-gray-900'}`}>
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
                    <p className="text-xs font-bold text-[#1C1C1C] truncate mb-0.5 bg-[#ECEAE4] rounded px-1.5 py-0.5 inline-block max-w-full">
                      {(room as any).post.title}
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
