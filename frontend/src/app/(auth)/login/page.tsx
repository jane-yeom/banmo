'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { kakaoLogin } from '@/lib/kakao';
import apiClient from '@/lib/axios';

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, setAuth } = useAuthStore();
  const [tab, setTab] = useState<'kakao' | 'email'>('kakao');
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    if (isLoggedIn) router.replace('/');
  }, [isLoggedIn]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendMsg('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', {
        username: form.username,
        password: form.password,
      });
      const data = res.data;
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
      setAuth(data.user, data.accessToken);
      router.replace('/');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg || '로그인에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // username 또는 이메일로 재발송 요청 - 이메일을 username 필드에 입력했을 경우
    const value = form.username;
    if (!value) { setError('아이디 또는 이메일을 입력해주세요.'); return; }
    try {
      const res = await apiClient.post('/auth/resend-verify', { email: value });
      setResendMsg(res.data.message || '재발송했습니다.');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || '재발송에 실패했습니다.');
    }
  };

  const showResend = error.includes('이메일 인증') || error.includes('메일함');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: 'linear-gradient(160deg, #FFFFFF 0%, #F0EDE6 50%, #FFFFFF 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: '40px 32px',
        width: '100%', maxWidth: 380, textAlign: 'center',
        boxShadow: '0 8px 40px rgba(28,28,28,0.15)',
      }}>
        {/* 로고 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <img src="/banmo-logo.png" alt="반모" style={{ height: 80, width: 'auto' }} />
        </div>
        <p style={{ color: '#1C1C1C', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>반주의 모든것</p>

        {/* 탭 */}
        <div style={{
          display: 'flex', background: '#F7F4ED',
          borderRadius: 12, padding: 4, marginBottom: 28,
        }}>
          {(['kakao', 'email'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setResendMsg(''); }}
              style={{
                flex: 1, padding: '9px 0', border: 'none', borderRadius: 9,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? '#000000' : '#9CA3AF',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {t === 'kakao' ? '카카오 로그인' : '아이디 로그인'}
            </button>
          ))}
        </div>

        {tab === 'kakao' ? (
          <>
            <button
              onClick={kakaoLogin}
              style={{
                width: '100%', padding: '14px', background: '#FEE500',
                border: 'none', borderRadius: 12, fontSize: 16,
                fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                color: '#191919', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <img
                src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png"
                alt="카카오" width={20} height={20}
              />
              카카오로 시작하기
            </button>
            <p style={{ marginTop: 20, fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
              카카오 계정으로 간편하게 시작하세요.
            </p>
          </>
        ) : (
          <form onSubmit={handleEmailLogin} style={{ textAlign: 'left' }}>
            {/* 아이디 */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 5, display: 'block' }}>아이디</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                border: '1.5px solid #E8E4DC', borderRadius: 12, padding: '0 14px',
              }}>
                <span style={{ fontSize: 15, color: '#9CA3AF', fontWeight: 500 }}>@</span>
                <input
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="아이디"
                  required
                  autoComplete="username"
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    fontSize: 15, padding: '13px 0', background: 'transparent',
                  }}
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 5, display: 'block' }}>비밀번호</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                border: '1.5px solid #E8E4DC', borderRadius: 12, padding: '0 14px',
              }}>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="비밀번호"
                  required
                  autoComplete="current-password"
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    fontSize: 15, padding: '13px 0', background: 'transparent',
                  }}
                />
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 18 }}>
              <Link href="/forgot-password" style={{ fontSize: 12, color: '#1C1C1C' }}>
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {error && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, fontSize: 13, color: '#EF4444' }}>
                {error}
                {showResend && (
                  <button
                    type="button"
                    onClick={handleResend}
                    style={{ display: 'block', marginTop: 6, fontSize: 12, color: '#1C1C1C', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    인증 메일 재발송
                  </button>
                )}
              </div>
            )}
            {resendMsg && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, fontSize: 13, color: '#16A34A' }}>
                {resendMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', background: '#1C1C1C',
                color: 'white', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
              계정이 없으신가요?{' '}
              <Link href="/signup" style={{ color: '#1C1C1C', fontWeight: 600 }}>회원가입</Link>
            </p>
          </form>
        )}
      </div>
      <p style={{ marginTop: 24, fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
        © 2026 반모. All rights reserved.
      </p>
    </div>
  );
}
