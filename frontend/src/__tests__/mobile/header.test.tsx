import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// ─── mocks ────────────────────────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
}))

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}))

jest.mock('@/lib/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockRejectedValue(new Error('no token')),
    post: jest.fn().mockResolvedValue({ data: {} }),
  },
}))

jest.mock('@/lib/kakao', () => ({
  initKakao: jest.fn(),
}))

jest.mock('@/lib/socket', () => ({
  getSocket: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
  })),
}))

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({
  requestFcmToken: jest.fn().mockResolvedValue(null),
}))

const mockLogout = jest.fn()
let mockAuthState = {
  user: null as any,
  isLoggedIn: false,
  setAuth: jest.fn(),
  logout: mockLogout,
  accessToken: null as string | null,
}

jest.mock('@/store/auth.store', () => ({
  useAuthStore: () => mockAuthState,
}))

jest.mock('@/store/chat.store', () => ({
  useChatStore: () => ({
    unreadCount: 0,
    setUnreadCount: jest.fn(),
  }),
}))

import Header from '@/components/layout/Header'

// ─── 테스트 ───────────────────────────────────────────────────────────────────
describe('모바일 헤더', () => {
  beforeEach(() => {
    window.innerWidth = 390
    mockAuthState = {
      user: null,
      isLoggedIn: false,
      setAuth: jest.fn(),
      logout: mockLogout,
      accessToken: null,
    }
    mockLogout.mockClear()
  })

  it('로고가 렌더링된다 (헤더 + 드로어 2개)', () => {
    render(<Header />)
    const logos = screen.getAllByAltText('반모')
    expect(logos.length).toBeGreaterThanOrEqual(1)
    expect(logos[0]).toBeInTheDocument()
  })

  it('햄버거 메뉴 버튼이 보인다', () => {
    render(<Header />)
    const menuBtn = screen.getByRole('button', { name: '메뉴 열기' })
    expect(menuBtn).toBeInTheDocument()
  })

  it('햄버거 버튼 클릭시 드로어 메뉴가 열린다', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }))
    const navItems = screen.getAllByText('구인구직')
    expect(navItems.length).toBeGreaterThanOrEqual(1)
    const boardItems = screen.getAllByText('게시판')
    expect(boardItems.length).toBeGreaterThanOrEqual(1)
  })

  it('드로어에서 X 버튼 클릭시 닫힌다', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }))
    fireEvent.click(screen.getByRole('button', { name: '메뉴 닫기' }))
    const loginLink = screen.getByText('카카오로 로그인')
    expect(loginLink).toBeInTheDocument()
  })

  it('비로그인시 드로어에 로그인 버튼이 표시된다', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }))
    expect(screen.getByText('카카오로 로그인')).toBeInTheDocument()
  })

  it('로그인시 닉네임이 드로어에 표시된다', () => {
    mockAuthState = {
      user: {
        nickname: '김피아노유저',
        noteGrade: 'WHOLE',
        profileImage: null,
        id: 'u1',
        email: null,
        role: 'USER',
      },
      isLoggedIn: true,
      setAuth: jest.fn(),
      logout: mockLogout,
      accessToken: 'token',
    }
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }))
    const nicknames = screen.getAllByText('김피아노유저')
    expect(nicknames.length).toBeGreaterThanOrEqual(1)
  })

  it('로그인시 음표등급이 표시된다', () => {
    mockAuthState = {
      user: {
        nickname: '박바이올린',
        noteGrade: 'QUARTER',
        profileImage: null,
        id: 'u2',
        email: null,
        role: 'USER',
      },
      isLoggedIn: true,
      setAuth: jest.fn(),
      logout: mockLogout,
      accessToken: 'token',
    }
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }))
    expect(screen.getByText('♩ 4분음표')).toBeInTheDocument()
  })

  it('로그아웃 버튼 클릭시 logout이 호출된다', () => {
    mockAuthState = {
      user: {
        nickname: '유저',
        noteGrade: 'HALF',
        profileImage: null,
        id: 'u3',
        email: null,
        role: 'USER',
      },
      isLoggedIn: true,
      setAuth: jest.fn(),
      logout: mockLogout,
      accessToken: 'token',
    }
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }))
    fireEvent.click(screen.getByText('로그아웃'))
    expect(mockLogout).toHaveBeenCalled()
  })

  it('ESC 키로 드로어가 닫힌다', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('배경없음')).not.toBeInTheDocument()
  })

  it('내 계정 메뉴 항목들이 표시된다 (로그인시)', () => {
    mockAuthState = {
      user: {
        nickname: '테스터',
        noteGrade: 'EIGHTH',
        profileImage: null,
        id: 'u4',
        email: null,
        role: 'USER',
      },
      isLoggedIn: true,
      setAuth: jest.fn(),
      logout: mockLogout,
      accessToken: 'token',
    }
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }))
    expect(screen.getByText('마이페이지')).toBeInTheDocument()
    expect(screen.getByText('채팅')).toBeInTheDocument()
    expect(screen.getByText('즐겨찾기')).toBeInTheDocument()
    expect(screen.getByText('프로필 편집')).toBeInTheDocument()
  })

  it('HALF 등급이 올바르게 표시된다', () => {
    mockAuthState = {
      user: { nickname: '유저2', noteGrade: 'HALF', profileImage: null, id: 'u5', email: null, role: 'USER' },
      isLoggedIn: true,
      setAuth: jest.fn(),
      logout: mockLogout,
      accessToken: 'token',
    }
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }))
    expect(screen.getByText('♩ 2분음표')).toBeInTheDocument()
  })
})
