'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const code = searchParams.get('code');
    console.log('[콜백] URL 전체:', window.location.href);
    console.log('[콜백] code 값:', code);

    if (!code) {
      console.error('[콜백] code 없음, 로그인 페이지로 이동');
      router.push('/login');
      return;
    }

    const handleCallback = async () => {
      try {
        console.log('[콜백] 백엔드로 code 전송 중...');
        const res = await api.post('/auth/kakao/callback', { code });
        console.log('[콜백] 응답:', res.data);

        const { accessToken, user } = res.data;
        localStorage.setItem('accessToken', accessToken);
        Cookies.set('accessToken', accessToken, { expires: 7 });
        setAuth(user, accessToken);
        // persist 저장 완료 대기 후 이동
        await new Promise((resolve) => setTimeout(resolve, 100));
        router.replace('/');
      } catch (error: any) {
        console.error('[콜백] 오류:', error.response?.data || error.message);
        router.push('/login?error=true');
      }
    };

    handleCallback();
  }, [searchParams, router, setAuth]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '16px',
    }}>
      <div>카카오 로그인 처리 중...</div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
