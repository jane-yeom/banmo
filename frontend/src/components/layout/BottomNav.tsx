'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { Home, Briefcase, PenLine, MessageCircle, User, LucideIcon } from 'lucide-react';

interface Tab {
  Icon: LucideIcon;
  label: string;
  href: string;
  highlight?: boolean;
  showBadge?: boolean;
}

export default function BottomNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuthStore();
  const { unreadCount } = useChatStore();

  const getWriteHref = () => {
    if (pathname.startsWith('/promo')) return '/write/promo?category=PROMO_CONCERT';
    if (pathname.startsWith('/board')) return '/write/board?type=FREE';
    if (pathname.startsWith('/jobs')) return '/write/jobs?category=JOB_OFFER';
    return '/write/jobs?category=JOB_OFFER';
  };

  const tabs: Tab[] = [
    { Icon: Home, label: '홈', href: '/' },
    { Icon: Briefcase, label: '구인구직', href: '/jobs' },
    { Icon: PenLine, label: '글쓰기', href: getWriteHref(), highlight: true },
    { Icon: MessageCircle, label: '채팅', href: '/chat', showBadge: true },
    { Icon: User, label: '내정보', href: isLoggedIn ? '/mypage' : '/login' },
  ];

  const hideOn = ['/login', '/welcome', '/auth/callback', '/admin'];
  if (hideOn.some((p) => pathname.startsWith(p))) return null;

  const writeTab = tabs.find((t) => t.highlight)!;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'white',
      borderTop: '1px solid #E8E4DC',
      zIndex: 50,
      boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
      overflow: 'visible',
    }}>
      {/* 탭 아이콘 영역: 항상 56px */}
      <div style={{ display: 'flex', height: 56, alignItems: 'center' }}>
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          const { Icon } = tab;

          if (tab.highlight) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  flex: 1, display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textDecoration: 'none',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  marginTop: -18,
                }}
              >
                <div style={{
                  width: 50, height: 50,
                  background: '#1C1C1C',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                  flexShrink: 0,
                }}>
                  <Icon size={22} strokeWidth={2} color="white" />
                </div>
                <span style={{ fontSize: 10, color: '#1C1C1C', fontWeight: 600, marginTop: 2 }}>
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
              <div style={{ position: 'relative', marginBottom: 3 }}>
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  color={isActive ? '#1C1C1C' : '#9CA3AF'}
                />
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
              </div>
              <span style={{
                fontSize: 10,
                color: isActive ? '#1C1C1C' : '#9CA3AF',
                fontWeight: isActive ? 700 : 400,
              }}>
                {tab.label}
              </span>
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: 0,
                  width: 4, height: 4, borderRadius: '50%',
                  background: '#1C1C1C',
                }} />
              )}
            </Link>
          );
        })}
      </div>
      {/* safe-area 여백 */}
      <div style={{ height: 'env(safe-area-inset-bottom)', background: 'white' }} />
    </nav>
  );
}
