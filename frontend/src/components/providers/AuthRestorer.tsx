'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export default function AuthRestorer() {
  const { isLoggedIn, setAuth, logout } = useAuthStore();

  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token || isLoggedIn) return;

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
      }
    };

    restoreAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
