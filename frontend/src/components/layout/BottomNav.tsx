'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useChatStore } from '@/store/chat.store';

const NAV_ITEMS = [
  { href: '/',       icon: '🏠', label: '홈' },
  { href: '/jobs',   icon: '🎹', label: '구인구직' },
  { href: '/board',  icon: '📋', label: '게시판' },
  { href: '/chat',   icon: '💬', label: '채팅', showBadge: true },
  { href: '/mypage', icon: '👤', label: '마이' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useChatStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white md:hidden">
      <div className="flex h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                isActive ? 'text-violet-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="relative text-xl leading-none">
                {item.icon}
                {item.showBadge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
