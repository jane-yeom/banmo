'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { KeyRound, CheckCircle } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/auth/confirm-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || '비밀번호 재설정에 실패했습니다.');
        return;
      }
      setDone(true);
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <>
        <CheckCircle size={56} color="#7B82BE" style={{ margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 10 }}>
          비밀번호 변경 완료
        </h1>
        <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 32 }}>
          비밀번호가 성공적으로 변경되었습니다.
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
          로그인하러 가기
        </button>
      </>
    );
  }

  return (
    <>
      <KeyRound size={48} color="#7B82BE" style={{ margin: '0 auto 16px' }} />
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 10 }}>
        새 비밀번호 설정
      </h1>
      {!token ? (
        <p style={{ fontSize: 14, color: '#EF4444' }}>유효하지 않은 링크입니다.</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ textAlign: 'left', marginTop: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              새 비밀번호
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="최소 8자 이상"
              required
              style={{
                width: '100%', padding: '11px 14px',
                border: '1.5px solid #DDD9EF', borderRadius: 10,
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 재입력"
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
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={<p style={{ fontSize: 14, color: '#9CA3AF' }}>로딩 중...</p>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
