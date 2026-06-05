'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Mail } from 'lucide-react';
import apiClient from '@/lib/axios';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', passwordConfirm: '', nickname: '' });
  const [usernameChecked, setUsernameChecked] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const checkUsername = async () => {
    if (!form.username) return;
    const regex = /^[a-zA-Z0-9_]{4,20}$/;
    if (!regex.test(form.username)) {
      setUsernameChecked(false);
      setError('아이디는 영문, 숫자, _(밑줄)만 4~20자 사용 가능합니다.');
      return;
    }
    setCheckingUsername(true);
    setError('');
    try {
      const res = await apiClient.get(`/auth/check-username?username=${form.username}`);
      setUsernameChecked(res.data.available);
      if (!res.data.available) setError('이미 사용 중인 아이디입니다.');
    } catch {
      setUsernameChecked(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (usernameChecked !== true) { setError('아이디 중복확인을 해주세요.'); return; }
    if (form.password !== form.passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    if (form.password.length < 8) { setError('비밀번호는 최소 8자 이상이어야 합니다.'); return; }
    if (form.nickname.length < 2) { setError('닉네임은 최소 2자 이상이어야 합니다.'); return; }
    if (!agreed) { setError('이용약관에 동의해주세요.'); return; }

    setLoading(true);
    try {
      await apiClient.post('/auth/register', {
        username: form.username,
        password: form.password,
        nickname: form.nickname,
        email: form.email,
      });
      setDone(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg || '회원가입에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    flex: 1, border: 'none', outline: 'none',
    fontSize: 15, padding: '13px 0', background: 'transparent',
  };

  const boxStyle = (borderColor = '#E8E4DC') => ({
    display: 'flex', alignItems: 'center', gap: 8,
    border: `1.5px solid ${borderColor}`, borderRadius: 12, padding: '0 14px',
  });

  if (done) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F0EDE6 50%, #FFFFFF 100%)',
        padding: '20px',
      }}>
        <div style={{
          background: 'white', borderRadius: 24, padding: '48px 32px',
          width: '100%', maxWidth: 380, textAlign: 'center',
          boxShadow: '0 8px 40px rgba(28,28,28,0.15)',
        }}>
          <CheckCircle size={56} color="#1C1C1C" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 10 }}>
            인증 메일을 확인해주세요
          </h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.7, marginBottom: 32 }}>
            <strong style={{ color: '#000000' }}>{form.email}</strong>로<br />
            인증 메일을 발송했습니다.<br />
            메일의 링크를 클릭하면 가입이 완료됩니다.
          </p>
          <button onClick={() => router.push('/login')} style={{
            width: '100%', padding: '14px', background: '#1C1C1C',
            color: 'white', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            로그인 페이지로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: 'linear-gradient(160deg, #FFFFFF 0%, #F0EDE6 50%, #FFFFFF 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: '36px 28px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 8px 40px rgba(28,28,28,0.15)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/banmo-logo.png" alt="반모" style={{ height: 56, width: 'auto', marginBottom: 6 }} />
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>회원가입</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 아이디 */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 5, display: 'block' }}>아이디</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={boxStyle(usernameChecked === true ? '#5AAB7A' : usernameChecked === false ? '#EF4444' : '#E8E4DC')}>
                <span style={{ fontSize: 14, color: '#9CA3AF' }}>@</span>
                <input
                  value={form.username}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, username: e.target.value.toLowerCase() }));
                    setUsernameChecked(null);
                  }}
                  placeholder="영문, 숫자, _ 4~20자"
                  maxLength={20}
                  style={inputStyle}
                />
                {usernameChecked === true && <span style={{ color: '#5AAB7A', fontSize: 16 }}>✓</span>}
                {usernameChecked === false && <span style={{ color: '#EF4444', fontSize: 16 }}>✗</span>}
              </div>
              <button
                type="button"
                onClick={checkUsername}
                disabled={checkingUsername || !form.username}
                style={{
                  padding: '0 14px', borderRadius: 12, flexShrink: 0,
                  background: usernameChecked === true ? '#EAF6EF' : '#F0EDE6',
                  color: usernameChecked === true ? '#5AAB7A' : '#000000',
                  border: 'none', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  opacity: checkingUsername || !form.username ? 0.6 : 1,
                }}
              >
                {checkingUsername ? '확인중' : usernameChecked === true ? '사용가능' : '중복확인'}
              </button>
            </div>
          </div>

          {/* 비밀번호 */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 5, display: 'block' }}>비밀번호</label>
            <div style={boxStyle()}>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="8자 이상"
                style={inputStyle}
              />
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 5, display: 'block' }}>비밀번호 확인</label>
            <div style={boxStyle(form.passwordConfirm && form.password !== form.passwordConfirm ? '#EF4444' : '#E8E4DC')}>
              <input
                type="password"
                value={form.passwordConfirm}
                onChange={(e) => setForm((p) => ({ ...p, passwordConfirm: e.target.value }))}
                placeholder="비밀번호 재입력"
                style={inputStyle}
              />
            </div>
          </div>

          {/* 닉네임 */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 5, display: 'block' }}>닉네임</label>
            <div style={boxStyle()}>
              <input
                value={form.nickname}
                onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
                placeholder="화면에 표시되는 이름 (2~20자)"
                maxLength={20}
                style={inputStyle}
              />
            </div>
          </div>

          {/* 이메일 (인증용) */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 5, display: 'block' }}>
              이메일 <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(인증용)</span>
            </label>
            <div style={boxStyle()}>
              <Mail size={16} color="#9CA3AF" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="인증 코드를 받을 이메일"
                style={inputStyle}
              />
            </div>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
              💡 로그인 아이디가 아닌 인증·비밀번호 찾기 수단으로만 사용됩니다
            </p>
          </div>

          {/* 약관 동의 */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#1C1C1C' }}
            />
            <span style={{ fontSize: 13, color: '#374151' }}>
              <Link href="/terms" style={{ color: '#1C1C1C' }}>이용약관</Link> 및{' '}
              <Link href="/privacy" style={{ color: '#1C1C1C' }}>개인정보처리방침</Link>에 동의합니다
            </span>
          </label>

          {error && (
            <div style={{ marginBottom: 12, padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, fontSize: 13, color: '#EF4444' }}>
              {error}
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
            {loading ? '처리 중...' : '가입하기'}
          </button>

          <p style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
            이미 계정이 있으신가요?{' '}
            <Link href="/login" style={{ color: '#1C1C1C', fontWeight: 600 }}>로그인</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
