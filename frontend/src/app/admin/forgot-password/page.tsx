'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) return setError('이메일을 입력해주세요');
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSent(true);
    } catch (e: any) {
      setError(e.message || '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: '#1A1A2E',
    }}>
      <div style={{
        background: '#16213E', borderRadius: 20,
        padding: '40px', width: '100%', maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        border: '1px solid #0F3460',
      }}>
        <button onClick={() => router.push('/admin/login')}
          style={{
            background: 'none', border: 'none',
            cursor: 'pointer', marginBottom: 20,
            display: 'flex', alignItems: 'center',
            gap: 4, color: '#9CA3AF', fontSize: 13,
          }}>
          <ChevronLeft size={16} />
          로그인으로 돌아가기
        </button>

        <h1 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          비밀번호 찾기
        </h1>
        <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 28, lineHeight: 1.5 }}>
          가입한 이메일로 재설정 링크를 보내드립니다
        </p>

        {sent ? (
          <div style={{
            background: '#0D2B1A', border: '1px solid #5AAB7A',
            borderRadius: 10, padding: '16px',
            color: '#5AAB7A', fontSize: 14,
            textAlign: 'center', lineHeight: 1.6,
          }}>
            ✅ 이메일을 확인해주세요<br />
            <span style={{ fontSize: 12, color: '#4A8A6A' }}>
              링크는 30분 후 만료됩니다
            </span>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                background: '#3D1515', border: '1px solid #EF4444',
                borderRadius: 8, padding: '10px 14px',
                color: '#FCA5A5', fontSize: 13, marginBottom: 16,
              }}>
                ⚠️ {error}
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                color: '#9CA3AF', fontSize: 12,
                fontWeight: 600, display: 'block', marginBottom: 6,
              }}>
                이메일
              </label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="admin@banmo.com"
                style={{
                  width: '100%', padding: '12px 14px',
                  background: '#0F3460', border: '1px solid #1A4A8A',
                  borderRadius: 10, color: 'white',
                  fontSize: 15, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <button onClick={handleSubmit} disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#4A5190' : 'linear-gradient(135deg, #7B82BE, #5A63A8)',
                color: 'white', border: 'none',
                borderRadius: 12, fontSize: 16,
                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              {loading ? '발송 중...' : '재설정 링크 발송'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
