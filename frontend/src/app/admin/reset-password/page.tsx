'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) router.replace('/admin/login');
  }, [token, router]);

  const handleSubmit = async () => {
    if (!password || password.length < 8) {
      return setError('비밀번호는 8자 이상이어야 합니다');
    }
    if (password !== confirm) {
      return setError('비밀번호가 일치하지 않습니다');
    }
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/auth/confirm-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('비밀번호가 변경되었습니다');
      router.replace('/admin/login');
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
        border: '1px solid #0F3460',
      }}>
        <h1 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
          새 비밀번호 설정
        </h1>
        {error && (
          <div style={{
            background: '#3D1515', border: '1px solid #EF4444',
            borderRadius: 8, padding: '10px 14px',
            color: '#FCA5A5', fontSize: 13, marginBottom: 16,
          }}>⚠️ {error}</div>
        )}
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            새 비밀번호
          </label>
          <input type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="8자 이상"
            style={{
              width: '100%', padding: '12px 14px',
              background: '#0F3460', border: '1px solid #1A4A8A',
              borderRadius: 10, color: 'white', fontSize: 15,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            비밀번호 확인
          </label>
          <input type="password" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="비밀번호 재입력"
            style={{
              width: '100%', padding: '12px 14px',
              background: '#0F3460', border: '1px solid #1A4A8A',
              borderRadius: 10, color: 'white', fontSize: 15,
              outline: 'none', boxSizing: 'border-box',
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
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#1A1A2E', color: 'white' }}>로딩 중...</div>}>
      <ResetContent />
    </Suspense>
  );
}
