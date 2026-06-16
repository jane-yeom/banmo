'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, User, MoreVertical, Image as ImageIcon, Send, Ban, LockOpen, ChevronDown, Music, ShieldCheck, ClipboardList, Star } from 'lucide-react';
import ReviewModal from '@/components/common/ReviewModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useChatMessages } from '@/hooks/useChat';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { useNotificationStore } from '@/store/notification.store';
import { getSocket } from '@/lib/socket';
import apiClient from '@/lib/axios';
import { uploadImage } from '@/lib/upload';
import { ChatMessage, ChatRoom } from '@/types';

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
        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }}
      />
    );
  }
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0, background: '#F0EDE6', color: '#1C1C1C' }}>
      {(nickname ?? '?')[0]}
    </div>
  );
}

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { user, accessToken, isRestoring } = useAuthStore();
  const { decrementUnread, setUnreadCount } = useChatStore();
  const { notifications, markAsRead: markNotifAsRead } = useNotificationStore();
  const qc = useQueryClient();

  const { data: initialMessages } = useChatMessages(roomId);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [opponent, setOpponent] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const initialScrollDone = useRef(false);

  // 상대방 정보 (room에서 파생)
  const otherId = room
    ? room.sender.id === user?.id ? room.receiver.id : room.sender.id
    : null;

  // 차단 목록 조회
  const { data: blockList } = useQuery({
    queryKey: ['blockList'],
    queryFn: () => apiClient.get<{ id: string; blocked: { id: string } }[]>('/users/block/list').then(r => r.data),
    enabled: !!user,
  });
  const isBlocked = blockList?.some(b => b.blocked?.id === otherId) ?? false;

  const blockMutation = useMutation({
    mutationFn: (userId: string) => apiClient.post(`/users/block/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blockList'] });
      toast.success('차단되었습니다');
      setShowMenu(false);
    },
    onError: () => toast.error('오류가 발생했습니다'),
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => apiClient.delete(`/users/block/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blockList'] });
      toast.success('차단이 해제되었습니다');
      setShowMenu(false);
    },
    onError: () => toast.error('오류가 발생했습니다'),
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // 키보드 올라올 때 입력창을 visualViewport 기준으로 올림 (iOS/Android 공통)
  // 컨테이너 전체 리사이즈보다 입력창 translateY가 더 안정적
  useEffect(() => {
    const bar = inputBarRef.current;
    if (!bar) return;
    const update = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      // 레이아웃 뷰포트 하단과 비주얼 뷰포트 하단의 차이 = 키보드 높이
      const keyboardH = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      bar.style.transform = `translateY(-${keyboardH}px)`;
    };
    update();
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // 키보드 열릴 때 메시지 목록 최하단 유지
  useEffect(() => {
    const onResize = () => { scrollToBottom(false); };
    window.visualViewport?.addEventListener('resize', onResize);
    return () => { window.visualViewport?.removeEventListener('resize', onResize); };
  }, [scrollToBottom]);

  useEffect(() => {
    if (!mounted || isRestoring) return;
    if (!user) { router.push('/login'); return; }
  }, [mounted, isRestoring, user, router]);

  // 채팅방 입장 시 해당 방의 채팅 알림 자동 읽음 처리
  useEffect(() => {
    if (!roomId) return;
    const chatLink = `/chat/${roomId}`;
    const unreadChatNotifs = notifications.filter(
      n => n.type === 'CHAT_MESSAGE' && n.link === chatLink && !n.isRead
    );
    unreadChatNotifs.forEach(n => {
      markNotifAsRead(n.id);
      apiClient.patch(`/notifications/${n.id}/read`).catch(() => {});
    });
  }, [roomId, notifications, markNotifAsRead]);

  // 채팅방 정보 로드
  useEffect(() => {
    if (!roomId || !user) return;
    apiClient.get<RoomInfo>(`/chat/rooms/${roomId}`).then(({ data }) => {
      setRoom(data);
      const opponentId = data.sender.id === user.id ? data.receiver.id : data.sender.id;
      const hasApplied = data.post !== null;
      const profileEndpoint = hasApplied ? `/users/${opponentId}/full` : `/users/${opponentId}`;
      apiClient.get(profileEndpoint)
        .catch(() => apiClient.get(`/users/${opponentId}`))
        .then((res) => setOpponent(res.data?.data || res.data))
        .catch(() => {});
    });
  }, [roomId, user]);

  // 초기 메시지 세팅
  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  // 스크롤 하단 이동 - scrollTop 방식이 scrollIntoView보다 신뢰성 높음
  const scrollToBottom = useCallback((smooth = true) => {
    const el = messagesRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    // 초기 로드는 즉시 스크롤, 이후 새 메시지는 smooth
    const smooth = initialScrollDone.current;
    if (!initialScrollDone.current) initialScrollDone.current = true;
    scrollToBottom(smooth);
  }, [messages, scrollToBottom]);

  // Socket.io 연결
  useEffect(() => {
    if (!accessToken || !roomId) return;

    const socket = getSocket(accessToken);

    const onConnect = () => {
      setConnected(true);
      socket.emit('joinRoom', roomId);
      socket.emit('markAsRead', roomId);
      qc.invalidateQueries({ queryKey: ['chatRooms'] });
      // 채팅방 진입 즉시 unreadCount 갱신
      apiClient.get<ChatRoom[]>('/chat/rooms').then(({ data }) => {
        const { setUnreadCount } = useChatStore.getState();
        const userId = useAuthStore.getState().user?.id;
        const count = data.filter((r) => !r.isRead && r.lastSenderId !== userId).length;
        setUnreadCount(count);
      }).catch(() => {});
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
        // 상대방이 읽음 → 내가 보낸 메시지들의 isRead를 true로 갱신
        setMessages((prev) =>
          prev.map((m) =>
            m.sender.id === user?.id ? { ...m, isRead: true } : m,
          ),
        );
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
    if (!content || !accessToken) return;
    const socket = getSocket(accessToken);
    socket.emit('sendMessage', { roomId, content });
    setInput('');
    inputRef.current?.focus();
  }, [input, accessToken, roomId]);

  // 파일 선택 시 미리보기만 열기 (아직 업로드 안 함)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview({ file, url });
    if (imageRef.current) imageRef.current.value = '';
  };

  // 미리보기에서 확인 후 실제 전송
  const confirmImageSend = async () => {
    if (!imagePreview) return;
    const { file, url: previewUrl } = imagePreview;
    setImagePreview(null);
    URL.revokeObjectURL(previewUrl);
    setImageUploading(true);
    try {
      const url = await uploadImage(file);
      const socket = getSocket(accessToken!);
      socket.emit('sendImage', { roomId, imageUrl: url });
    } catch {
      toast.error('이미지 전송 실패');
    } finally {
      setImageUploading(false);
    }
  };

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


  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#F9FAFB' }} onClick={() => showMenu && setShowMenu(false)}>
      {showReviewModal && otherId && (
        <ReviewModal
          revieweeId={otherId}
          revieweeName={other?.nickname ?? ''}
          postId={room?.postId ?? undefined}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      {/* 이미지 미리보기 모달 */}
      {imagePreview && (
        <div
          onClick={() => { URL.revokeObjectURL(imagePreview.url); setImagePreview(null); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {/* 미리보기 이미지 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview.url}
              alt="미리보기"
              style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 16, objectFit: 'contain' }}
            />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>이 사진을 전송하시겠습니까?</p>
            {/* 버튼 */}
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                onClick={() => { URL.revokeObjectURL(imagePreview.url); setImagePreview(null); }}
                style={{
                  flex: 1, padding: '14px',
                  background: 'rgba(255,255,255,0.15)', color: 'white',
                  border: 'none', borderRadius: 14,
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={confirmImageSend}
                style={{
                  flex: 1, padding: '14px',
                  background: '#1C1C1C', color: 'white',
                  border: 'none', borderRadius: 14,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 채팅방 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'white',
        borderBottom: '0.5px solid #E8E4DC',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none',
          cursor: 'pointer', padding: 4,
          display: 'flex', alignItems: 'center',
        }}>
          <ChevronLeft size={24} color="#1C1C1C" strokeWidth={2} />
        </button>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/banmo-logo.png" alt="홈" style={{ height: 24, width: 'auto', opacity: 0.6 }} />
        </Link>
        {other && (
          <>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0EDE6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {other.profileImage ? (
                <Image src={other.profileImage} alt={other.nickname ?? '?'} width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              ) : (
                <User size={20} color="#1C1C1C" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{other.nickname ?? '익명'}</div>
              <div style={{ fontSize: 11, color: '#1C1C1C' }}>{other.noteGrade}</div>
            </div>
            <Link href={`/profile/${other.id}`} className="flex-shrink-0 text-xs text-gray-400 hover:text-purple-600">
              프로필
            </Link>
            {/* 더보기 메뉴 */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                <MoreVertical size={20} color="#6B7280" />
              </button>
              {showMenu && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, zIndex: 20,
                  background: 'white', border: '1px solid #E5E7EB',
                  borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: 130, overflow: 'hidden',
                }}>
                  <button
                    onClick={() => {
                      if (!otherId) return;
                      if (isBlocked) {
                        unblockMutation.mutate(otherId);
                      } else {
                        if (confirm(`${other.nickname ?? '상대방'}을 차단하시겠습니까?\n차단하면 이 사용자의 메시지를 받지 않습니다.`)) {
                          blockMutation.mutate(otherId);
                        }
                      }
                    }}
                    style={{
                      width: '100%', padding: '12px 16px',
                      background: 'none', border: 'none',
                      textAlign: 'left', fontSize: 14,
                      color: isBlocked ? '#5AAB7A' : '#EF4444',
                      cursor: 'pointer',
                    }}
                  >
                    {isBlocked
                      ? <><LockOpen size={14} strokeWidth={1.8} style={{ display: 'inline', marginRight: 4 }} />차단 해제</>
                      : <><Ban size={14} strokeWidth={1.8} style={{ display: 'inline', marginRight: 4 }} />차단하기</>
                    }
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {/* 연결 상태 */}
      {!connected && (
        <div className="text-center text-xs text-amber-600 py-1 bg-amber-50">
          ⚡ 연결 중...
        </div>
      )}

      {/* 프로필 미니 배너 */}
      {other && (
        <>
          <div
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              background: '#F7F4ED',
              borderBottom: '0.5px solid #E8E4DC',
              padding: '10px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#F0EDE6', overflow: 'hidden',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                {(opponent?.profileImage || other.profileImage)
                  ? <img src={opponent?.profileImage || other.profileImage!}
                      alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User size={18} color="#1C1C1C" />
                }
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {opponent?.nickname || other.nickname}
                </div>
                <div style={{
                  fontSize: 11, color: '#1C1C1C',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Music size={10} />
                  {opponent?.instruments?.join(', ') || '악기 미설정'}
                  {(opponent?.region) && ` · ${opponent.region}`}
                </div>
              </div>
            </div>
            <ChevronDown
              size={16} color="#9CA3AF"
              style={{
                transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </div>

          {/* 펼쳐지는 프로필 상세 */}
          {profileOpen && opponent && (
            <div style={{
              background: 'white',
              borderBottom: '0.5px solid #E8E4DC',
              padding: '16px',
            }}>
              {/* 음표 등급 */}
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 8, marginBottom: 12,
              }}>
                <div style={{
                  background: '#F0EDE6', borderRadius: 99,
                  padding: '4px 12px', fontSize: 12,
                  color: '#000000', fontWeight: 600,
                }}>
                  ♩ {opponent.noteGrade === 'WHOLE' ? '온음표'
                    : opponent.noteGrade === 'HALF' ? '2분음표'
                    : opponent.noteGrade === 'QUARTER' ? '4분음표'
                    : opponent.noteGrade === 'EIGHTH' ? '8분음표'
                    : '16분음표'}
                </div>
                {opponent.isVerified && (
                  <div style={{
                    background: '#EAF6EF', color: '#5AAB7A',
                    fontSize: 11, fontWeight: 600,
                    padding: '4px 10px', borderRadius: 99,
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <ShieldCheck size={11} /> 인증
                  </div>
                )}
              </div>

              {/* 자기소개 */}
              {opponent.bio && opponent.isBioPublic && (
                <p style={{
                  fontSize: 13, color: '#444',
                  lineHeight: 1.6, marginBottom: 12,
                  background: '#F7F4ED', borderRadius: 8,
                  padding: '8px 12px',
                }}>
                  {opponent.bio}
                </p>
              )}

              {/* 악기 태그 */}
              {opponent.instruments?.length > 0 && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap',
                  gap: 6, marginBottom: 12,
                }}>
                  {opponent.instruments.map((inst: string) => (
                    <span key={inst} style={{
                      background: '#F0EDE6', color: '#000000',
                      fontSize: 12, padding: '4px 10px',
                      borderRadius: 99, fontWeight: 500,
                    }}>
                      {inst}
                    </span>
                  ))}
                </div>
              )}

              {/* 버튼 */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => router.push(`/profile/${opponent.id}`)}
                  style={{
                    flex: 1, padding: '10px',
                    background: '#F0EDE6', color: '#000000',
                    border: 'none', borderRadius: 10,
                    fontSize: 13, fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 5,
                  }}>
                  <User size={14} /> 전체 프로필 보기
                </button>
                {room?.post && (
                  <button
                    onClick={() => router.push(`/jobs/${room.post!.id}`)}
                    style={{
                      flex: 1, padding: '10px',
                      background: '#F7F4ED', color: '#6B7280',
                      border: 'none', borderRadius: 10,
                      fontSize: 13, fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 5,
                    }}>
                    <ClipboardList size={14} /> 공고 보기
                  </button>
                )}
              </div>
              {room?.post && otherId && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  style={{
                    width: '100%', marginTop: 8, padding: '10px',
                    background: '#1C1C1C', color: 'white',
                    border: 'none', borderRadius: 10,
                    fontSize: 13, fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 6,
                  }}>
                  <Star size={14} fill="white" strokeWidth={0} /> 후기 남기기
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* 메시지 목록 */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
                  {msg.imageUrl ? (
                    <div
                      style={{ maxWidth: 200, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
                      onClick={() => window.open(msg.imageUrl, '_blank')}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.imageUrl}
                        alt="이미지"
                        style={{ width: '100%', display: 'block', borderRadius: 12 }}
                      />
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                        isMine
                          ? 'text-white rounded-br-sm'
                          : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                      }`}
                      style={isMine ? { background: 'linear-gradient(135deg, #1C1C1C, #000000)' } : undefined}
                    >
                      {msg.content}
                    </div>
                  )}

                  {/* 시간 + 읽음 표시 */}
                  {showTime && (
                    <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* 내 메시지: 안읽음이면 "1" 배지, 읽었으면 "읽음" */}
                      {isMine && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: msg.isRead ? '#9CA3AF' : '#F59E0B',
                            minWidth: 14,
                            textAlign: 'center',
                          }}
                        >
                          {msg.isRead ? '읽음' : '1'}
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

      {/* 입력창 - translateY로 키보드 바로 위에 붙음 */}
      <div
        ref={inputBarRef}
        className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 4px)',
          willChange: 'transform', // 레이어 분리로 translateY 성능 개선
        }}
      >
        <div className="mx-auto flex items-end gap-2 max-w-3xl">
          <button
            onClick={() => imageRef.current?.click()}
            disabled={imageUploading}
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#F7F4ED', border: 'none',
              cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {imageUploading
              ? <span style={{ fontSize: 11, color: '#9CA3AF' }}>...</span>
              : <ImageIcon size={18} color="#1C1C1C" strokeWidth={1.8} />
            }
          </button>
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none max-h-32 transition-colors"
            style={{ overflowY: 'auto' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: input.trim() ? '#1C1C1C' : '#E8E4DC',
              border: 'none', cursor: input.trim() ? 'pointer' : 'default',
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            aria-label="전송"
          >
            <Send size={18} color="white" strokeWidth={2} />
          </button>
        </div>
        <p className="mt-1.5 text-center text-xs text-gray-400">Enter 전송 · Shift+Enter 줄바꿈</p>
      </div>
    </div>
  );
}
