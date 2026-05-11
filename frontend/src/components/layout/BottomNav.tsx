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
    if (pathname.startsWith('/promo')) return '/write/promo';
    if (pathname.startsWith('/trade')) return '/write/trade';
    if (pathname.startsWith('/board')) return '/write/board';
    return '/write/jobs';
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

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'white',
      borderTop: '1px solid #DDD9EF',
      display: 'flex',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -4px 16px rgba(90,99,168,0.08)',
    }}>
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
                justifyContent: 'center',
                padding: '8px 0',
                textDecoration: 'none',
              }}
            >
              <div style={{
                width: 46, height: 46,
                background: 'linear-gradient(135deg, #7B82BE, #5A63A8)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 2,
                boxShadow: '0 4px 14px rgba(90,99,168,0.45)',
                transform: 'translateY(-10px)',
              }}>
                <Icon size={20} strokeWidth={2} color="white" />
              </div>
              <span style={{
                fontSize: 10, color: '#7B82BE',
                fontWeight: 600,
                transform: 'translateY(-10px)',
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
            <div style={{ position: 'relative', marginBottom: 3 }}>
              <Icon
                size={24}
                strokeWidth={isActive ? 2.2 : 1.6}
                color={isActive ? '#7B82BE' : '#9CA3AF'}
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
              color: isActive ? '#7B82BE' : '#9CA3AF',
              fontWeight: isActive ? 700 : 400,
            }}>
              {tab.label}
            </span>
            {isActive && (
              <div style={{
                position: 'absolute', bottom: 0,
                width: 4, height: 4, borderRadius: '50%',
                background: '#7B82BE',
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
