'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || '요청에 실패했습니다.');
        return;
      }
      setDone(true);
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #FFFFFF 0%, #ECEAF8 50%, #FFFFFF 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white', borderRadius: 24,
        padding: '48px 32px', width: '100%',
        maxWidth: 380, textAlign: 'center',
        boxShadow: '0 8px 40px rgba(123,130,190,0.15)',
      }}>
        <Mail size={48} color="#7B82BE" style={{ margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 10 }}>
          비밀번호 찾기
        </h1>

        {done ? (
          <>
            <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.7, marginBottom: 32 }}>
              <strong style={{ color: '#5A63A8' }}>{email}</strong>으로<br />
              비밀번호 재설정 링크를 발송했습니다.<br />
              메일을 확인해주세요.
            </p>
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
        ) : (
          <>
            <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 28 }}>
              가입 시 사용한 이메일을 입력하면<br />
              비밀번호 재설정 링크를 보내드립니다.
            </p>
            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  required
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1.5px solid #DDD9EF', borderRadius: 10,
                    fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              {error && (
                <div style={{ marginBottom: 14, padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, fontSize: 13, color: '#EF4444' }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: '#7B82BE', color: 'white',
                  border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? '전송 중...' : '재설정 링크 보내기'}
              </button>
            </form>
            <p style={{ marginTop: 20, fontSize: 13, color: '#9CA3AF' }}>
              <Link href="/login" style={{ color: '#7B82BE', fontWeight: 600 }}>
                로그인으로 돌아가기
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
