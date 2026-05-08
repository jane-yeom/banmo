import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// ─── 공통 mocks ────────────────────────────────────────────────────────────────
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/',
}))

jest.mock('@/lib/axios', () => ({
  __esModule: true,
  default: {
    patch: jest.fn().mockResolvedValue({ data: { nickname: '저장완료', profileImage: '' } }),
    get: jest.fn().mockResolvedValue({ data: {} }),
  },
}))

jest.mock('@/lib/upload', () => ({
  uploadImage: jest.fn().mockResolvedValue('https://image.example.jpg'),
}))

// ─── 빈 닉네임 mock (검증 테스트용) ─────────────────────────────────────────
jest.mock('@/store/auth.store', () => {
  const useAuthStore = jest.fn(() => ({
    user: { nickname: null, profileImage: null },
    accessToken: 'mock-token',
    setAuth: jest.fn(),
    isLoggedIn: true,
  }))
  useAuthStore.getState = jest.fn(() => ({ isLoggedIn: true }))
  return { useAuthStore }
})

import WelcomePage from '@/app/welcome/page'

describe('신규 가입 프로필 설정 (모바일)', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    jest.clearAllMocks()
  })

  // ── 기본 렌더링 ──────────────────────────────────────────────────────────────
  it('환영 메시지가 표시된다', () => {
    render(<WelcomePage />)
    expect(screen.getByText('반모에 오신걸 환영해요!')).toBeInTheDocument()
  })

  it('반모 로고 이미지가 표시된다', () => {
    render(<WelcomePage />)
    expect(screen.getByAltText('반모')).toBeInTheDocument()
  })

  it('스텝 1: 닉네임 입력 폼이 표시된다', () => {
    render(<WelcomePage />)
    expect(screen.getByPlaceholderText('사용할 닉네임을 입력해주세요')).toBeInTheDocument()
  })

  it('스텝 인디케이터 2개가 표시된다', () => {
    render(<WelcomePage />)
    // 스텝 바: border-radius 2px 두 개
    const bars = document.querySelectorAll('div[style*="height: 4px"]')
    expect(bars.length).toBe(2)
  })

  it('자기소개 textarea가 표시된다', () => {
    render(<WelcomePage />)
    expect(screen.getByPlaceholderText('간단한 자기소개를 입력해주세요')).toBeInTheDocument()
  })

  // ── 닉네임 검증 (빈 닉네임 mock 사용) ──────────────────────────────────────
  it('닉네임 미입력시 다음 버튼을 눌러도 스텝2로 이동 안함', () => {
    render(<WelcomePage />)
    // user.nickname = null → nickname state = '' → 검증 실패
    fireEvent.click(screen.getByText('다음 →'))
    expect(screen.queryByText(/악기 선택/)).not.toBeInTheDocument()
  })

  // ── 스텝2 관련 테스트 (닉네임 있는 사용자 → 직접 step 제어) ─────────────────
  // 닉네임이 유효한 경우 스텝2에 접근할 수 있음을 검증
  // WelcomePage의 step 버튼 로직을 직접 테스트
  it('다음 버튼이 렌더링된다 (스텝1)', () => {
    render(<WelcomePage />)
    expect(screen.getByText('다음 →')).toBeInTheDocument()
  })

  it('자기소개 입력이 가능하다', () => {
    render(<WelcomePage />)
    const textarea = screen.getByPlaceholderText('간단한 자기소개를 입력해주세요')
    fireEvent.change(textarea, { target: { value: '안녕하세요' } })
    expect(textarea).toHaveValue('안녕하세요')
  })

  it('프로필 이미지 변경 버튼이 있다', () => {
    render(<WelcomePage />)
    expect(screen.getByText('프로필 사진 변경')).toBeInTheDocument()
  })

  it('파일 입력이 숨겨져 있다', () => {
    render(<WelcomePage />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()
    expect(fileInput.style.display).toBe('none')
  })
})

// ─── 스텝2 진입 테스트 (유효한 닉네임 mock) ────────────────────────────────────
// 별도 describe로 mock 재정의
describe('신규 가입 - 스텝2 (유효한 닉네임)', () => {
  beforeAll(() => {
    // useAuthStore mock 재정의: 유효한 닉네임 '테스터'
    const { useAuthStore } = require('@/store/auth.store')
    useAuthStore.mockImplementation(() => ({
      user: { nickname: '테스터', profileImage: null },
      accessToken: 'mock-token',
      setAuth: jest.fn(),
      isLoggedIn: true,
    }))
    useAuthStore.getState = jest.fn(() => ({ isLoggedIn: true }))
  })

  it('유효한 닉네임이 있으면 다음 버튼 클릭 후 스텝2로 이동', () => {
    render(<WelcomePage />)
    // 닉네임이 '테스터'로 초기화됨
    fireEvent.click(screen.getByText('다음 →'))
    expect(screen.getByText(/악기 선택/)).toBeInTheDocument()
  })

  it('스텝2: 피아노 악기가 있다', () => {
    render(<WelcomePage />)
    fireEvent.click(screen.getByText('다음 →'))
    expect(screen.getByText('피아노')).toBeInTheDocument()
  })

  it('스텝2: 바이올린 악기가 있다', () => {
    render(<WelcomePage />)
    fireEvent.click(screen.getByText('다음 →'))
    expect(screen.getByText('바이올린')).toBeInTheDocument()
  })

  it('스텝2: 악기 선택 토글 (선택)', () => {
    render(<WelcomePage />)
    fireEvent.click(screen.getByText('다음 →'))
    fireEvent.click(screen.getByText('피아노'))
    expect(screen.getByText('피아노')).toHaveStyle({ background: '#EDE9FE' })
  })

  it('스텝2: 악기 선택 토글 (해제)', () => {
    render(<WelcomePage />)
    fireEvent.click(screen.getByText('다음 →'))
    fireEvent.click(screen.getByText('피아노'))
    fireEvent.click(screen.getByText('피아노'))
    expect(screen.getByText('피아노')).not.toHaveStyle({ background: '#EDE9FE' })
  })

  it('스텝2: 이전 버튼으로 스텝1로 돌아간다', () => {
    render(<WelcomePage />)
    fireEvent.click(screen.getByText('다음 →'))
    fireEvent.click(screen.getByText('← 이전'))
    expect(screen.getByPlaceholderText('사용할 닉네임을 입력해주세요')).toBeInTheDocument()
  })

  it('스텝2: 나중에 설정 버튼이 있다', () => {
    render(<WelcomePage />)
    fireEvent.click(screen.getByText('다음 →'))
    expect(screen.getByText('나중에 설정할게요')).toBeInTheDocument()
  })

  it('스텝2: 시작하기 버튼이 있다', () => {
    render(<WelcomePage />)
    fireEvent.click(screen.getByText('다음 →'))
    expect(screen.getByText(/시작하기/)).toBeInTheDocument()
  })

  it('저장 버튼 클릭시 /users/me PATCH 호출', async () => {
    const { default: api } = require('@/lib/axios')
    api.patch.mockClear()
    api.patch.mockResolvedValue({ data: { nickname: '테스터', profileImage: '' } })

    render(<WelcomePage />)
    fireEvent.click(screen.getByText('다음 →'))

    await act(async () => {
      fireEvent.click(screen.getByText(/시작하기/))
    })

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/users/me',
        expect.objectContaining({ nickname: '테스터' })
      )
    })
  })
})
