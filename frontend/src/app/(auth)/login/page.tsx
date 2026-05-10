'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { kakaoLogin } from '@/lib/kakao'

export default function LoginPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuthStore()

  useEffect(() => {
    if (isLoggedIn) router.replace('/')
  }, [isLoggedIn])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #FFFFFF 0%, #FFF0F4 50%, #FFFFFF 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        padding: '48px 32px',
        width: '100%',
        maxWidth: 380,
        textAlign: 'center',
        boxShadow: '0 8px 40px rgba(232,120,154,0.15)',
      }}>
        {/* 로고 중앙 정렬 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 8,
        }}>
          <img
            src="/banmo-logo.png"
            alt="반모"
            style={{
              height: 100,
              width: 'auto',
              display: 'block',
            }}
          />
        </div>

        <p style={{
          color: '#E8789A',
          fontSize: 14,
          marginBottom: 40,
          lineHeight: 1.5,
        }}>
          반주의 모든것
        </p>

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={kakaoLogin}
          style={{
            width: '100%',
            padding: '14px',
            background: '#FEE500',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: '#191919',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
          <img
            src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png"
            alt="카카오"
            width={20}
            height={20}
          />
          카카오로 시작하기
        </button>

        <p style={{
          marginTop: 24,
          fontSize: 12,
          color: '#9CA3AF',
          lineHeight: 1.6,
        }}>
          카카오 계정으로 간편하게 시작하세요.<br />
          가입 후 닉네임과 프로필 사진을 변경할 수 있어요.
        </p>
      </div>

      <p style={{
        marginTop: 24,
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
      }}>
        © 2026 반모. All rights reserved.
      </p>
    </div>
  )
}
