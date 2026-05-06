'use client';

import { kakaoLogin } from '@/lib/kakao';

export default function LoginPage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#F9FAFB',
      padding: '0 20px',
    }}>
      <div style={{
        background: 'white', borderRadius: 16,
        padding: '48px 40px', width: '100%',
        maxWidth: 400, textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎵</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: '#111827' }}>
          반모
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 40 }}>
          반주의 모든것
        </p>

        <button
          onClick={kakaoLogin}
          style={{
            width: '100%', padding: '14px',
            background: '#FEE500', border: 'none',
            borderRadius: 12, fontSize: 16,
            fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            color: '#191919',
          }}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M9 1C4.582 1 1 3.806 1 7.248c0 2.184 1.388 4.102 3.488 5.22l-.89 3.28c-.08.295.266.529.51.352L8.14 13.64c.285.032.573.05.86.05 4.418 0 8-2.806 8-6.248C17 3.806 13.418 1 9 1z"
              fill="#191919"/>
          </svg>
          카카오로 시작하기
        </button>

        <p style={{ marginTop: 24, fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
          카카오 계정으로 간편하게 시작하세요.<br/>
          가입 후 닉네임과 프로필 사진을 변경할 수 있어요.
        </p>
      </div>
    </div>
  );
}
