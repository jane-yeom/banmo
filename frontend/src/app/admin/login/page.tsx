'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '로그인 실패');

      const { accessToken, user } = data;
      localStorage.setItem('accessToken', accessToken);
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `accessToken=${accessToken};max-age=${maxAge};path=/;SameSite=Lax`;
      setAuth(user, accessToken);
      router.replace('/admin');
    } catch (e: any) {
      setError(e.message || '로그인에 실패했습니다');
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
        padding: '48px 40px', width: '100%', maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        border: '1px solid #0F3460',
      }}>
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎵</div>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0 }}>
            반모 관리자
          </h1>
          <p style={{ color: '#7B82BE', fontSize: 13, marginTop: 6 }}>
            Administrator Login
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            background: '#3D1515', border: '1px solid #EF4444',
            borderRadius: 8, padding: '10px 14px',
            color: '#FCA5A5', fontSize: 13, marginBottom: 16,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* 이메일 */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            이메일
          </label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="admin@banmo.com"
            style={{
              width: '100%', padding: '12px 14px',
              background: '#0F3460', border: '1px solid #1A4A8A',
              borderRadius: 10, color: 'white', fontSize: 15,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 비밀번호 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            비밀번호
          </label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            style={{
              width: '100%', padding: '12px 14px',
              background: '#0F3460', border: '1px solid #1A4A8A',
              borderRadius: 10, color: 'white', fontSize: 15,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 로그인 버튼 */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px',
            background: loading ? '#4A5190' : 'linear-gradient(135deg, #7B82BE, #5A63A8)',
            color: 'white', border: 'none',
            borderRadius: 12, fontSize: 16,
            fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(90,99,168,0.4)',
          }}>
          {loading ? '로그인 중...' : '관리자 로그인'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a href="/admin/forgot-password"
            style={{ fontSize: 13, color: '#7B82BE', textDecoration: 'none' }}>
            비밀번호를 잊으셨나요?
          </a>
        </div>

        <p style={{
          textAlign: 'center', marginTop: 16,
          fontSize: 12, color: '#4B5563',
          lineHeight: 1.5,
        }}>
          🔒 관리자 전용 페이지입니다.<br />
          승인된 계정만 접근할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
