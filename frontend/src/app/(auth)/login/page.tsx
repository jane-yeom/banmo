'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { kakaoLogin } from '@/lib/kakao'

export default function LoginPage() {
  const router = useRouter()
  const { isLoggedIn, logout } = useAuthStore()

  useEffect(() => {
    if (!isLoggedIn) return

    // Zustand persist에 isLoggedIn:true가 남아있어도
    // 실제 토큰(쿠키 or localStorage)이 없으면 stale 상태 → 초기화
    const hasToken =
      localStorage.getItem('accessToken') ||
      document.cookie.split(';').some((c) => c.trim().startsWith('accessToken='))

    if (hasToken) {
      // 로그인 상태 정상 → 홈으로
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect')
      router.replace(redirect || '/')
    } else {
      // Zustand stale 상태 → 초기화 후 로그인 페이지 유지
      logout()
    }
  }, [isLoggedIn, logout, router])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #F7F4ED, #F0EDE6, #F7F4ED)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white', borderRadius: 24,
        padding: '48px 32px', width: '100%', maxWidth: 380,
        textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        border: '0.5px solid #E8E4DC',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/banmo-logo.png" alt="반모"
          style={{ height: 90, width: 'auto', display: 'block', margin: '0 auto 16px' }} />

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#1C1C1C' }}>
          반모
        </h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 40, lineHeight: 1.6 }}>
          반주자와 연주자를 연결하는<br/>음악 매칭 플랫폼
        </p>

        <button onClick={kakaoLogin} style={{
          width: '100%', padding: '15px',
          background: '#FEE500', border: 'none',
          borderRadius: 12, fontSize: 16,
          fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8,
          color: '#191919',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png"
            alt="카카오" width={22} height={22}
          />
          카카오로 1초 로그인
        </button>

        <p style={{
          marginTop: 20, fontSize: 12,
          color: '#9CA3AF', lineHeight: 1.6,
        }}>
          카카오 계정으로 간편하게 시작하세요.<br/>
          별도 가입 없이 바로 이용 가능해요.
        </p>
      </div>

      <p style={{
        marginTop: 20, fontSize: 11,
        color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6,
      }}>
        로그인 시 <a href="/terms" style={{ color: '#888' }}>이용약관</a> 및{' '}
        <a href="/privacy" style={{ color: '#888' }}>개인정보처리방침</a>에 동의하게 됩니다
      </p>
    </div>
  )
}
