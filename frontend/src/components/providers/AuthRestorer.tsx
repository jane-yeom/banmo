'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

// iOS PWA는 Safari와 localStorage가 분리되지만 쿠키는 공유됨
function getTokenFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function AuthRestorer() {
  const { isLoggedIn, setAuth, logout, setRestoring } = useAuthStore();

  useEffect(() => {
    const restoreAuth = async () => {
      if (isLoggedIn) {
        setRestoring(false);
        return;
      }

      // localStorage 우선, 없으면 쿠키에서 읽기 (iOS PWA 대응)
      let token = localStorage.getItem('accessToken');
      if (!token) {
        token = getTokenFromCookie();
        if (token) {
          // 쿠키에서 찾았으면 localStorage에도 동기화
          localStorage.setItem('accessToken', token);
        }
      }

      if (!token) {
        setRestoring(false);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('토큰 만료');
        const user = await res.json();
        setAuth(user, token);
      } catch {
        localStorage.removeItem('accessToken');
        document.cookie = 'accessToken=;max-age=0;path=/';
        logout();
      } finally {
        setRestoring(false);
      }
    };

    restoreAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
