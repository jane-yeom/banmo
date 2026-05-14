'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import apiClient from '@/lib/axios';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.email) {
      setError('아이디와 이메일을 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', {
        username: form.username,
        email: form.email,
      });
      setDone(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg || '요청에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const inputBox = {
    display: 'flex', alignItems: 'center', gap: 8,
    border: '1.5px solid #DDD9EF', borderRadius: 12, padding: '0 14px',
  } as React.CSSProperties;

  const inputStyle = {
    flex: 1, border: 'none', outline: 'none',
    fontSize: 15, padding: '13px 0', background: 'transparent',
  } as React.CSSProperties;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: 'linear-gradient(160deg, #FFFFFF 0%, #ECEAF8 50%, #FFFFFF 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: '48px 32px',
        width: '100%', maxWidth: 380, textAlign: 'center',
        boxShadow: '0 8px 40px rgba(123,130,190,0.15)',
      }}>
        <Mail size={48} color="#7B82BE" style={{ margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 10 }}>
          비밀번호 찾기
        </h1>

        {done ? (
          <>
            <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.7, marginBottom: 32 }}>
              입력하신 이메일로<br />
              비밀번호 재설정 링크를 발송했습니다.<br />
              메일을 확인해주세요.
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                width: '100%', padding: '14px', background: '#7B82BE',
                color: 'white', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >
              로그인 페이지로
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 24 }}>
              가입 시 등록한 아이디와 이메일을 입력하면<br />
              비밀번호 재설정 링크를 보내드립니다.
            </p>
            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 5, display: 'block' }}>아이디</label>
                <div style={inputBox}>
                  <span style={{ fontSize: 15, color: '#9CA3AF', fontWeight: 500 }}>@</span>
                  <input
                    value={form.username}
                    onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                    placeholder="가입 시 등록한 아이디"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 5, display: 'block' }}>
                  이메일 <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(인증용으로 등록한 이메일)</span>
                </label>
                <div style={inputBox}>
                  <Mail size={16} color="#9CA3AF" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="가입 시 등록한 이메일"
                    required
                    style={inputStyle}
                  />
                </div>
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
                  width: '100%', padding: '14px', background: '#7B82BE',
                  color: 'white', border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? '전송 중...' : '비밀번호 재설정 링크 받기'}
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
