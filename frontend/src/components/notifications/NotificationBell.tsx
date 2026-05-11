'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useNotificationStore, AppNotification } from '@/store/notification.store';
import { useMarkAsRead, useMarkAllAsRead, TYPE_ICON } from '@/hooks/useNotifications';

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function NotificationItem({ notification, onClose }: { notification: AppNotification; onClose: () => void }) {
  const router = useRouter();
  const markAsRead = useMarkAsRead();
  const icon = TYPE_ICON[notification.type] ?? '🔔';

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
    onClose();
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
        !notification.isRead ? 'bg-indigo-50' : ''
      }`}
    >
      <span className="flex-shrink-0 text-xl leading-none mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
          {notification.body}
        </p>
        <p className="mt-1 text-[11px] text-gray-400">
          {formatTime(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <span className="flex-shrink-0 mt-1.5 h-2 w-2 rounded-full bg-indigo-600" />
      )}
    </button>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount } = useNotificationStore();
  const markAllAsRead = useMarkAllAsRead();

  // 드롭다운 열릴 때 자동 전체읽음 처리
  const handleOpen = () => {
    setOpen((v) => {
      const nextOpen = !v;
      if (nextOpen && unreadCount > 0) {
        markAllAsRead.mutate();
      }
      return nextOpen;
    });
  };

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div className="relative" ref={panelRef}>
      {/* 벨 아이콘 버튼 */}
      <button
        onClick={handleOpen}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
        aria-label="알림"
      >
        <Bell
          size={22}
          strokeWidth={1.8}
          color={unreadCount > 0 ? '#7B82BE' : '#9CA3AF'}
          fill={unreadCount > 0 ? '#ECEAF8' : 'none'}
        />
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            background: '#7B82BE', color: 'white',
            fontSize: 10, fontWeight: 700,
            width: 18, height: 18, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* 드롭다운 패널 */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden z-50">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">알림</h3>
            <Link
              href="/notifications/settings"
              onClick={() => setOpen(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              설정
            </Link>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <span className="text-3xl mb-2">🔔</span>
                <p className="text-sm">알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onClose={() => setOpen(false)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
