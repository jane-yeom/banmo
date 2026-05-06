'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    console.log('[Callback] code:', code ? '있음' : '없음');

    if (!code) {
      router.replace('/login?error=no_code');
      return;
    }

    const handleCallback = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        console.log('[Callback] API URL:', apiUrl);

        const res = await fetch(`${apiUrl}/auth/kakao/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();
        console.log('[Callback] 응답:', data);

        if (!res.ok) throw new Error(data.message || '로그인 실패');

        const token = data.accessToken || data.data?.accessToken;
        const user = data.user || data.data?.user;

        if (!token) throw new Error('토큰 없음');

        console.log('[Callback] 토큰 저장 시작');

        // 1. localStorage 저장
        localStorage.setItem('accessToken', token);

        // 2. Zustand store 업데이트
        const { useAuthStore } = await import('@/store/auth.store');
        const store = useAuthStore.getState();
        store.setAuth(user, token);

        // 3. 쿠키 저장 (HTTPS 환경 Secure 플래그 자동 적용)
        const maxAge = 7 * 24 * 60 * 60;
        const secure = window.location.protocol === 'https:' ? ';Secure' : '';
        document.cookie = `accessToken=${token};max-age=${maxAge};path=/${secure};SameSite=Lax`;

        // 4. 신규/기존 유저 구분 후 이동
        const isNewUser = data.isNewUser === true;
        console.log('[Callback] 저장 완료, 신규유저:', isNewUser);

        setTimeout(() => {
          if (isNewUser) {
            router.replace('/welcome');
          } else {
            router.replace('/');
          }
        }, 300);
      } catch (error: any) {
        console.error('[Callback] 오류:', error.message);
        router.replace(`/login?error=${encodeURIComponent(error.message)}`);
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: 16,
    }}>
      <div style={{ fontSize: 32 }}>🎵</div>
      <div style={{ fontSize: 16, color: '#6B7280' }}>
        카카오 로그인 처리 중...
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}>
        로딩 중...
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
