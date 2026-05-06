'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';

interface BadgeCounts {
  pendingReports: number;
  pendingQna: number;
}

const NAV = [
  { href: '/admin',          label: '대시보드',    icon: '📊' },
  { href: '/admin/users',    label: '회원 관리',   icon: '👥' },
  { href: '/admin/posts',    label: '공고 관리',   icon: '📋' },
  { href: '/admin/boards',   label: '게시판 관리', icon: '📝' },
  { href: '/admin/notices',  label: '공지사항',    icon: '📢' },
  { href: '/admin/reports',  label: '신고 관리',   icon: '🚨', badge: 'reports' },
  { href: '/admin/qna',      label: 'QnA 관리',   icon: '💬', badge: 'qna' },
  // TODO: 유료 기능 활성화시 주석 해제
  // { href: '/admin/payments', label: '결제 관리',   icon: '💳' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  // zustand persist가 localStorage에서 상태를 복원할 때까지 대기
  useEffect(() => {
    if ((useAuthStore as any).persist?.hasHydrated?.()) {
      setHydrated(true);
    } else if ((useAuthStore as any).persist?.onFinishHydration) {
      const unsub = (useAuthStore as any).persist.onFinishHydration(() => setHydrated(true));
      return () => unsub?.();
    } else {
      // fallback: 마운트 후 localStorage 직접 확인
      setHydrated(true);
    }
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () =>
      apiClient.get('/admin/stats').then((r) => r.data),
    refetchInterval: 30_000,
    enabled: !!user && user.role === 'ADMIN',
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.push('/login?redirect=/admin');
      return;
    }
    if (user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">권한을 확인 중입니다...</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getPageTitle = () => {
    const nav = NAV.find((n) =>
      n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href),
    );
    return nav?.label ?? '관리자';
  };

  const pendingReports = stats?.reports?.pending ?? 0;
  const pendingQna = stats?.qna?.pending ?? 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside
        className="flex-shrink-0 flex flex-col"
        style={{ width: 240, background: '#1F2937', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 10 }}
      >
        {/* 로고 */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700">
          <span className="text-2xl">🎵</span>
          <div>
            <p className="text-white font-bold text-base leading-tight">반모 관리자</p>
            <p className="text-gray-400 text-xs">Admin Panel</p>
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-px bg-gray-700 mx-4 mt-1" />

        {/* 네비게이션 */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            const badge =
              item.badge === 'reports'
                ? pendingReports
                : item.badge === 'qna'
                ? pendingQna
                : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                style={
                  isActive
                    ? { background: '#7C3AED', color: '#fff' }
                    : { color: '#9CA3AF' }
                }
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span
                    className="text-white text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: item.badge === 'reports' ? '#EF4444' : '#F97316',
                      minWidth: 20,
                      textAlign: 'center',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 하단 유저 정보 */}
        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-gray-400 text-xs mb-0.5">관리자</p>
          <p className="text-white text-sm font-medium mb-3 truncate">{user.nickname ?? user.email}</p>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-xs font-medium text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-white transition-colors"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: 240 }}>
        {/* 상단 헤더 */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-[5]">
          <h1 className="text-xl font-bold text-gray-800">{getPageTitle()}</h1>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
