'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import apiClient from '@/lib/axios';
import { initKakao } from '@/lib/kakao';
import { getSocket } from '@/lib/socket';
import { ChatRoom } from '@/types';
import { useNotifications } from '@/hooks/useNotifications';

const navItems = [
  { label: '구인구직', href: '/jobs' },
  { label: '공연·연습실', href: '/promo' },
  { label: '양도·중고', href: '/trade' },
  { label: '게시판', href: '/board' },
  { label: '고객센터', href: '/support' },
];

function NotificationsInitializer() {
  useNotifications();
  return null;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isLoggedIn, setAuth, logout, accessToken } = useAuthStore();
  const { unreadCount, setUnreadCount } = useChatStore();
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  // 페이지 로드 시 localStorage 토큰으로 유저 상태 복원
  useEffect(() => {
    initKakao();
    const token = localStorage.getItem('accessToken');
    if (!token || isLoggedIn) return;
    apiClient
      .get('/auth/me')
      .then((res) => { setAuth(res.data, token); })
      .catch(() => { localStorage.removeItem('accessToken'); });
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

  // 메뉴 열릴 때 스크롤 잠금
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // 라우트 변경시 메뉴 닫기
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      {user && <NotificationsInitializer />}

      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'white',
        borderBottom: '1px solid #F3F4F6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '0 16px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
        }}>
          {/* 로고 */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <img src="/banmo-logo.png" alt="반모"
              style={{ height: 36, width: 'auto', mixBlendMode: 'multiply' }}/>
          </Link>

          {/* 데스크탑 네비 */}
          <nav style={{ display: 'none', gap: 4 }} className="desktop-nav">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} style={{
                padding: '8px 14px',
                borderRadius: 8,
                color: pathname.startsWith(item.href) ? '#E8789A' : '#374151',
                background: pathname.startsWith(item.href) ? '#FFF0F4' : 'transparent',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: pathname.startsWith(item.href) ? 600 : 400,
              }}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 우측 아이콘들 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLoggedIn && (
              <>
                <Link href="/notifications" style={{
                  fontSize: 20, textDecoration: 'none',
                  padding: '4px 8px',
                }}>🔔</Link>
                <Link href="/chat" style={{
                  position: 'relative',
                  fontSize: 20, textDecoration: 'none',
                  padding: '4px 8px',
                }}>
                  💬
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 0, right: 0,
                      background: '#EF4444', color: 'white',
                      borderRadius: '50%', width: 16, height: 16,
                      fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* 데스크탑: 프로필/로그인 */}
            {isLoggedIn ? (
              <Link href="/mypage" style={{
                display: 'none', alignItems: 'center',
                gap: 8, textDecoration: 'none',
              }} className="desktop-only">
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#FFF0F4', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  ) : (
                    <span style={{ fontSize: 16 }}>👤</span>
                  )}
                </div>
                <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                  {user?.nickname}
                </span>
              </Link>
            ) : (
              <Link href="/login"
                className="desktop-only"
                style={{
                  display: 'none',
                  padding: '8px 16px',
                  background: '#E8789A', color: 'white',
                  borderRadius: 8, textDecoration: 'none',
                  fontSize: 14, fontWeight: 600,
                }}>
                로그인
              </Link>
            )}

            {/* 모바일: 햄버거 버튼 */}
            <button
              onClick={() => setMenuOpen(true)}
              className="mobile-menu-btn"
              style={{
                background: 'none', border: 'none',
                fontSize: 24, cursor: 'pointer',
                padding: '4px 8px', color: '#374151',
              }}>
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 드로어 오버레이 */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
          }}/>
      )}

      {/* 모바일 드로어 메뉴 */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: 280, height: '100vh',
        background: 'white', zIndex: 101,
        transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
      }}>
        {/* 드로어 헤더 */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <img src="/banmo-logo.png" alt="반모"
            style={{ height: 28, width: 'auto', mixBlendMode: 'multiply' }}/>
          <button onClick={() => setMenuOpen(false)} style={{
            background: 'none', border: 'none',
            fontSize: 24, cursor: 'pointer', color: '#6B7280',
          }}>✕</button>
        </div>

        {/* 유저 정보 */}
        {isLoggedIn && user && (
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: '#FFF0F4', overflow: 'hidden',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {user.profileImage ? (
                <img src={user.profileImage} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              ) : (
                <span style={{ fontSize: 24 }}>👤</span>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {user.nickname}
              </div>
              <div style={{ fontSize: 12, color: '#E8789A', marginTop: 2 }}>
                {user.noteGrade === 'WHOLE' ? '♩ 온음표' :
                 user.noteGrade === 'HALF' ? '♩ 2분음표' :
                 user.noteGrade === 'QUARTER' ? '♩ 4분음표' :
                 user.noteGrade === 'EIGHTH' ? '♪ 8분음표' : '♬ 16분음표'}
              </div>
            </div>
          </div>
        )}

        {/* 네비게이션 메뉴 */}
        <nav style={{ padding: '12px 0', flex: 1 }}>
          <div style={{
            padding: '8px 20px',
            fontSize: 11, color: '#9CA3AF',
            fontWeight: 600, letterSpacing: '0.05em',
          }}>
            메뉴
          </div>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'block', padding: '12px 20px',
              color: pathname.startsWith(item.href) ? '#E8789A' : '#374151',
              background: pathname.startsWith(item.href) ? '#FFF0F4' : 'transparent',
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: pathname.startsWith(item.href) ? 600 : 400,
              borderLeft: pathname.startsWith(item.href)
                ? '3px solid #E8789A' : '3px solid transparent',
            }}>
              {item.label}
            </Link>
          ))}

          {isLoggedIn && (
            <>
              <div style={{
                padding: '16px 20px 8px',
                fontSize: 11, color: '#9CA3AF',
                fontWeight: 600, letterSpacing: '0.05em',
                marginTop: 8,
                borderTop: '1px solid #F3F4F6',
              }}>
                내 계정
              </div>
              {[
                { label: '마이페이지', href: '/mypage' },
                { label: '채팅', href: '/chat' },
                { label: '즐겨찾기', href: '/favorites' },
                { label: '알림 설정', href: '/notifications/settings' },
                { label: '프로필 편집', href: '/profile/edit' },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{
                  display: 'block', padding: '12px 20px',
                  color: '#374151', textDecoration: 'none',
                  fontSize: 15,
                }}>
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* 하단 로그인/로그아웃 */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #F3F4F6',
        }}>
          {isLoggedIn ? (
            <button onClick={handleLogout} style={{
              width: '100%', padding: '12px',
              background: '#FEF2F2', color: '#EF4444',
              border: '1px solid #FCA5A5', borderRadius: 8,
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>
              로그아웃
            </button>
          ) : (
            <Link href="/login" style={{
              display: 'block', textAlign: 'center',
              padding: '12px', background: '#E8789A',
              color: 'white', borderRadius: 8,
              fontSize: 15, fontWeight: 600,
              textDecoration: 'none',
            }}>
              카카오로 로그인
            </Link>
          )}
        </div>
      </div>

      {/* CSS */}
      <style jsx global>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-only { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-nav { display: none !important; }
          .desktop-only { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </>
  );
}
