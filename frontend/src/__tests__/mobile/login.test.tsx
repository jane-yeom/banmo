import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
}))

jest.mock('@/lib/kakao', () => ({
  kakaoLogin: jest.fn(),
}))

jest.mock('@/store/auth.store', () => ({
  useAuthStore: () => ({ isLoggedIn: false }),
}))

import LoginPage from '@/app/(auth)/login/page'

describe('로그인 페이지 (모바일)', () => {
  it('반모 로고 이미지가 표시된다', () => {
    render(<LoginPage />)
    const logo = screen.getByAltText('반모')
    expect(logo).toBeInTheDocument()
    expect(logo.tagName).toBe('IMG')
  })

  it('카카오 로그인 버튼이 표시된다', () => {
    render(<LoginPage />)
    expect(screen.getByText('카카오로 1초 로그인')).toBeInTheDocument()
  })

  it('이메일 입력 폼이 없다', () => {
    render(<LoginPage />)
    expect(screen.queryByPlaceholderText(/이메일/)).not.toBeInTheDocument()
  })

  it('비밀번호 입력 폼이 없다', () => {
    render(<LoginPage />)
    expect(screen.queryByPlaceholderText(/비밀번호/)).not.toBeInTheDocument()
  })

  it('카카오 버튼 클릭시 kakaoLogin 함수가 호출된다', () => {
    const { kakaoLogin } = require('@/lib/kakao')
    render(<LoginPage />)
    fireEvent.click(screen.getByText('카카오로 1초 로그인'))
    expect(kakaoLogin).toHaveBeenCalledTimes(1)
  })

  it('모바일 뷰포트(390px)에서 버튼이 전체 너비를 차지한다', () => {
    render(<LoginPage />)
    const btn = screen.getByText('카카오로 1초 로그인').closest('button')
    expect(btn).toHaveStyle({ width: '100%' })
  })

  it('안내 문구가 표시된다', () => {
    render(<LoginPage />)
    expect(screen.getByText(/카카오 계정으로 간편하게 시작하세요/)).toBeInTheDocument()
  })
})
