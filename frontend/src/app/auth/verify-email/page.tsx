'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('유효하지 않은 인증 링크입니다.');
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || '이메일 인증이 완료되었습니다.');
        } else {
          setStatus('error');
          setMessage(data.message || '인증에 실패했습니다.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      });
  }, [token]);

  return (
    <div style={{
      background: 'white', borderRadius: 24,
      padding: '48px 32px', width: '100%',
      maxWidth: 380, textAlign: 'center',
      boxShadow: '0 8px 40px rgba(123,130,190,0.15)',
    }}>
      {status === 'loading' && (
        <>
          <Loader size={56} color="#7B82BE" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>인증 중...</h1>
          <p style={{ fontSize: 14, color: '#9CA3AF' }}>이메일을 인증하고 있습니다.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle size={56} color="#7B82BE" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>인증 완료</h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 32 }}>{message}</p>
          <button
            onClick={() => router.push('/login')}
            style={{
              width: '100%', padding: '14px',
              background: '#7B82BE', color: 'white',
              border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            로그인하러 가기
          </button>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle size={56} color="#EF4444" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>인증 실패</h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 32 }}>{message}</p>
          <button
            onClick={() => router.push('/login')}
            style={{
              width: '100%', padding: '14px',
              background: '#7B82BE', color: 'white',
              border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            로그인 페이지로
          </button>
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #FFFFFF 0%, #ECEAF8 50%, #FFFFFF 100%)',
      padding: '20px',
    }}>
      <Suspense fallback={
        <div style={{
          background: 'white', borderRadius: 24,
          padding: '48px 32px', width: '100%',
          maxWidth: 380, textAlign: 'center',
          boxShadow: '0 8px 40px rgba(123,130,190,0.15)',
        }}>
          <Loader size={56} color="#7B82BE" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, color: '#9CA3AF' }}>로딩 중...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
