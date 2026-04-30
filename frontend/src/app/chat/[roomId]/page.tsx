'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useChatMessages } from '@/hooks/useChat';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { getSocket } from '@/lib/socket';
import apiClient from '@/lib/axios';
import { ChatMessage } from '@/types';

interface RoomInfo {
  id: string;
  postId: string | null;
  post: { id: string; title: string } | null;
  sender: { id: string; nickname: string | null; profileImage: string | null; noteGrade: string };
  receiver: { id: string; nickname: string | null; profileImage: string | null; noteGrade: string };
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Avatar({ src, nickname }: { src: string | null; nickname: string | null }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={nickname ?? '?'}
        width={32}
        height={32}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="h-8 w-8 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 text-sm font-bold flex-shrink-0">
      {(nickname ?? '?')[0]}
    </div>
  );
}

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { decrementUnread, setUnreadCount } = useChatStore();
  const qc = useQueryClient();

  const { data: initialMessages } = useChatMessages(roomId);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [readByOther, setReadByOther] = useState(false); // 상대방이 읽었는지
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
  }, [user, router]);

  // 채팅방 정보 로드
  useEffect(() => {
    if (!roomId) return;
    apiClient.get<RoomInfo>(`/chat/rooms/${roomId}`).then(({ data }) => setRoom(data));
  }, [roomId]);

  // 초기 메시지 세팅
  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  // 스크롤 하단 이동
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollToBottom(messages.length < 30);
  }, [messages, scrollToBottom]);

  // Socket.io 연결
  useEffect(() => {
    if (!accessToken || !roomId) return;

    const socket = getSocket(accessToken);

    const onConnect = () => {
      setConnected(true);
      socket.emit('joinRoom', roomId);
      socket.emit('markAsRead', roomId);
      // 이 방의 읽지 않은 수 초기화 → 전체 count 갱신
      qc.invalidateQueries({ queryKey: ['chatRooms'] });
    };

    const onDisconnect = () => setConnected(false);

    const onNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => {
        // 중복 방지
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // 상대방 메시지면 즉시 읽음 처리
      if (msg.sender.id !== user?.id) {
        socket.emit('markAsRead', roomId);
      }
    };

    const onMessagesRead = ({ userId }: { roomId: string; userId: string }) => {
      if (userId !== user?.id) {
        // 상대방이 읽음 → 내 메시지 전부 ✓✓ 표시
        setReadByOther(true);
      }
    };

    const onRoomUpdated = () => {
      qc.invalidateQueries({ queryKey: ['chatRooms'] });
    };

    if (socket.connected) {
      onConnect();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('newMessage', onNewMessage);
    socket.on('messagesRead', onMessagesRead);
    socket.on('roomUpdated', onRoomUpdated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('newMessage', onNewMessage);
      socket.off('messagesRead', onMessagesRead);
      socket.off('roomUpdated', onRoomUpdated);
    };
  }, [accessToken, roomId, user?.id, qc, setUnreadCount]);

  const sendMessage = useCallback(() => {
    const content = input.trim();
    if (!content || !connected) return;
    const socket = getSocket(accessToken!);
    socket.emit('sendMessage', { roomId, content });
    setInput('');
    inputRef.current?.focus();
  }, [input, connected, accessToken, roomId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 상대방 정보
  const other = room
    ? room.sender.id === user?.id
      ? room.receiver
      : room.sender
    : null;

  // 초기 읽음 여부 (마지막 메시지가 내 것이고 isRead인 경우)
  useEffect(() => {
    if (!messages.length || !user) return;
    const myLastMsg = [...messages].reverse().find((m) => m.sender.id === user.id);
    if (myLastMsg?.isRead) setReadByOther(true);
  }, [messages, user]);

  return (
    <div className="flex h-[100dvh] flex-col bg-gray-50">
      {/* 채팅방 헤더 */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="뒤로"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>

          {other && (
            <>
              <Avatar src={other.profileImage} nickname={other.nickname} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {other.nickname ?? '익명'}
                </p>
                {room?.post?.title && (
                  <Link
                    href={`/jobs/${room.postId}`}
                    className="text-xs text-violet-500 hover:underline truncate block"
                  >
                    📋 {room.post.title}
                  </Link>
                )}
              </div>
              <Link
                href={`/profile/${other.id}`}
                className="flex-shrink-0 text-xs text-gray-400 hover:text-violet-600"
              >
                프로필
              </Link>
            </>
          )}
        </div>

        {/* 연결 상태 */}
        {!connected && (
          <div className="mt-1.5 text-center text-xs text-amber-600">
            ⚡ 연결 중...
          </div>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="flex justify-center py-8">
              <p className="text-sm text-gray-400">
                {other ? `${other.nickname ?? '상대방'}와 대화를 시작해보세요.` : '대화를 시작해보세요.'}
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isMine = msg.sender.id === user?.id;
            const isLast = idx === messages.length - 1;
            const showTime = isLast || messages[idx + 1]?.sender.id !== msg.sender.id;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* 상대방 아바타 (첫 메시지 또는 발신자 변경 시) */}
                {!isMine ? (
                  idx === 0 || messages[idx - 1]?.sender.id !== msg.sender.id ? (
                    <Avatar src={msg.sender.profileImage} nickname={msg.sender.nickname} />
                  ) : (
                    <div className="w-8 flex-shrink-0" />
                  )
                ) : null}

                <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                  {/* 발신자 이름 (상대방, 첫 메시지) */}
                  {!isMine && (idx === 0 || messages[idx - 1]?.sender.id !== msg.sender.id) && (
                    <p className="text-xs text-gray-500 ml-1 mb-0.5">{msg.sender.nickname ?? '익명'}</p>
                  )}

                  {/* 말풍선 */}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                      isMine
                        ? 'bg-violet-700 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* 시간 + 읽음 표시 */}
                  {showTime && (
                    <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      {isMine && (
                        <span className={`text-xs ${readByOther ? 'text-violet-400' : 'text-gray-300'}`}>
                          {readByOther ? '✓✓' : '✓'}
                        </span>
                      )}
                      <p className="text-xs text-gray-400">{formatTime(msg.createdAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 입력창 */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3 safe-area-bottom">
        <div className="mx-auto flex items-end gap-2 max-w-3xl">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 max-h-32 transition-colors"
            style={{ overflowY: 'auto' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !connected}
            className="h-10 w-10 flex-shrink-0 rounded-full bg-violet-700 text-white flex items-center justify-center hover:bg-violet-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="전송"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.903 6.308a.75.75 0 00.723.519H13.5a.75.75 0 010 1.5H4.905l-1.903 6.308a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-center text-xs text-gray-400">Enter 전송 · Shift+Enter 줄바꿈</p>
      </div>
    </div>
  );
}
