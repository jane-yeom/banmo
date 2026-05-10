'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';

export default function BottomNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuthStore();
  const { unreadCount } = useChatStore();

  const tabs = [
    { icon: '🏠', label: '홈', href: '/' },
    { icon: '💼', label: '구인구직', href: '/jobs' },
    { icon: '✍️', label: '글쓰기', href: '/jobs/write', highlight: true },
    { icon: '💬', label: '채팅', href: '/chat', showBadge: true },
    { icon: '👤', label: '내정보', href: isLoggedIn ? '/mypage' : '/login' },
  ];

  // 숨길 페이지
  const hideOn = ['/login', '/welcome', '/auth/callback', '/admin'];
  if (hideOn.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'white',
      borderTop: '1px solid #F3F4F6',
      display: 'flex',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
    }}>
      {tabs.map((tab) => {
        const isActive =
          tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);

        if (tab.highlight) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex: 1, display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 0',
                textDecoration: 'none',
              }}
            >
              <div style={{
                width: 44, height: 44,
                background: '#E8789A',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                marginBottom: 2,
                boxShadow: '0 4px 12px rgba(232,120,154,0.4)',
                transform: 'translateY(-8px)',
              }}>
                {tab.icon}
              </div>
              <span style={{
                fontSize: 10, color: '#E8789A',
                fontWeight: 600,
                transform: 'translateY(-8px)',
              }}>
                {tab.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1, display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 0',
              textDecoration: 'none',
              position: 'relative',
            }}
          >
            <span style={{
              fontSize: 22, marginBottom: 2,
              position: 'relative',
            }}>
              {tab.icon}
              {tab.showBadge && unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -8,
                  background: '#EF4444', color: 'white',
                  borderRadius: '50%', width: 16, height: 16,
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            <span style={{
              fontSize: 10,
              color: isActive ? '#E8789A' : '#9CA3AF',
              fontWeight: isActive ? 700 : 400,
            }}>
              {tab.label}
            </span>
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                width: 4, height: 4,
                borderRadius: '50%',
                background: '#E8789A',
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
