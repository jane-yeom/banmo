import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// ─── mocks ────────────────────────────────────────────────────────────────────
// NOTE: jest.mock factories are hoisted. Use closure-stable references to avoid
// infinite re-render loops caused by unstable deps in useEffect([me, reset, router]).

jest.mock('next/navigation', () => {
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn() }
  return {
    useRouter: () => router,
    usePathname: () => '/',
  }
})

jest.mock('@/store/auth.store', () => {
  const user = {
    id: 'user-1',
    nickname: '원래닉네임',
    profileImage: null as string | null,
    bio: '',
    region: '',
    instruments: [] as string[],
    email: 'test@test.com',
    role: 'USER',
    noteGrade: 'QUARTER',
  }
  const useAuthStore = jest.fn(() => ({
    user,
    isLoggedIn: true,
    accessToken: 'test-token',
    setAuth: jest.fn(),
  }))
  return { useAuthStore }
})

jest.mock('@/lib/axios', () => ({
  __esModule: true,
  default: {
    patch: jest.fn().mockResolvedValue({
      data: { data: { id: 'user-1', nickname: '수정완료', profileImage: 'https://new-image.example.jpg' } },
    }),
    get: jest.fn().mockResolvedValue({
      data: {
        id: 'user-1',
        nickname: '원래닉네임',
        profileImage: null,
        bio: '자기소개',
        region: '서울',
        instruments: [],
        videoUrls: [],
      },
    }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({
      data: { data: { uploadUrl: 'https://s3.url', fileUrl: 'https://cdn.url/video.mp4', key: 'k' } },
    }),
  },
}))

jest.mock('@/lib/upload', () => ({
  uploadImage: jest.fn().mockResolvedValue('https://new-image.example.jpg'),
}))

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toasts: [], show: jest.fn(), dismiss: jest.fn() }),
}))

jest.mock('@/components/common/Toast', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}))

jest.mock('react-hook-form', () => {
  const reset = jest.fn()
  return {
    useForm: () => ({
      register: (name: string) => ({
        name,
        onChange: jest.fn(),
        onBlur: jest.fn(),
        ref: jest.fn(),
      }),
      handleSubmit: (fn: any) => (e: any) => {
        e?.preventDefault?.()
        fn({ nickname: '원래닉네임', bio: '자기소개', region: '서울' })
      },
      reset,
      formState: { errors: {} },
    }),
  }
})

import ProfileEditPage from '@/app/profile/edit/page'

// ─── 테스트 ───────────────────────────────────────────────────────────────────
describe('프로필 편집 페이지 (모바일)', () => {
  beforeEach(() => {
    const { default: api } = require('@/lib/axios')
    api.patch.mockClear()
    api.get.mockClear()
    api.get.mockResolvedValue({
      data: {
        id: 'user-1',
        nickname: '원래닉네임',
        profileImage: null,
        bio: '자기소개',
        region: '서울',
        instruments: [],
        videoUrls: [],
      },
    })
    api.patch.mockResolvedValue({
      data: { data: { id: 'user-1', nickname: '수정완료', profileImage: 'https://new-image.example.jpg' } },
    })
    const { uploadImage } = require('@/lib/upload')
    uploadImage.mockClear()
    uploadImage.mockResolvedValue('https://new-image.example.jpg')
  })

  it('프로필 편집 제목이 표시된다', async () => {
    render(<ProfileEditPage />)
    await waitFor(() => expect(screen.getByText('프로필 편집')).toBeInTheDocument(), { timeout: 5000 })
  })

  it('로드 후 닉네임 입력 필드가 있다', async () => {
    render(<ProfileEditPage />)
    await waitFor(() => expect(screen.getByPlaceholderText('닉네임')).toBeInTheDocument(), { timeout: 5000 })
  })

  it('사진 변경 버튼이 있다', async () => {
    render(<ProfileEditPage />)
    await waitFor(() => expect(screen.getByText('사진 변경')).toBeInTheDocument(), { timeout: 5000 })
  })

  it('저장하기 버튼이 있다', async () => {
    render(<ProfileEditPage />)
    await waitFor(() => expect(screen.getByText('저장하기')).toBeInTheDocument(), { timeout: 5000 })
  })

  it('뒤로 버튼이 있다', async () => {
    render(<ProfileEditPage />)
    await waitFor(() => expect(screen.getByText('← 뒤로')).toBeInTheDocument(), { timeout: 5000 })
  })

  it('연주 영상 섹션이 있다', async () => {
    render(<ProfileEditPage />)
    await waitFor(() => expect(screen.getByText('연주 영상')).toBeInTheDocument(), { timeout: 5000 })
  })

  it('악기 선택 섹션이 있다', async () => {
    render(<ProfileEditPage />)
    await waitFor(() => expect(screen.getByText('담당 악기')).toBeInTheDocument(), { timeout: 5000 })
  })

  it('악기 선택 토글이 작동한다', async () => {
    render(<ProfileEditPage />)
    await waitFor(() => screen.getByText('피아노'), { timeout: 5000 })
    fireEvent.click(screen.getByText('피아노'))
    expect(screen.getByText('피아노').closest('label')).toHaveClass('border-violet-400')
  })

  // ── 핵심 버그 수정 검증 ──────────────────────────────────────────────────────
  it('[버그수정] 이미지 업로드시 /users/me/profile-image를 즉시 호출하지 않는다', async () => {
    const { default: api } = require('@/lib/axios')
    render(<ProfileEditPage />)

    await waitFor(() => screen.getByText('사진 변경'), { timeout: 5000 })

    const fileInput = document.querySelector(
      'input[type="file"][accept*="image"]'
    ) as HTMLInputElement

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    const { uploadImage } = require('@/lib/upload')
    await waitFor(() => expect(uploadImage).toHaveBeenCalledWith(file), { timeout: 5000 })

    // 이미지 전용 API는 호출되지 않아야 함
    expect(api.patch).not.toHaveBeenCalledWith('/users/me/profile-image', expect.anything())
  })

  it('[버그수정] 저장 버튼 클릭시 profileImage 포함 한번에 PATCH 호출', async () => {
    const { default: api } = require('@/lib/axios')
    render(<ProfileEditPage />)

    await waitFor(() => screen.getByText('사진 변경'), { timeout: 5000 })

    // 이미지 업로드
    const fileInput = document.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    const { uploadImage } = require('@/lib/upload')
    await waitFor(() => expect(uploadImage).toHaveBeenCalled(), { timeout: 5000 })

    // 저장 버튼 클릭
    await act(async () => {
      fireEvent.click(screen.getByText('저장하기'))
    })

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/users/me',
        expect.objectContaining({
          profileImage: 'https://new-image.example.jpg',
        })
      )
    }, { timeout: 5000 })
  })

  it('[버그수정] 저장 전까지 /users/me PATCH 미호출', async () => {
    const { default: api } = require('@/lib/axios')
    render(<ProfileEditPage />)
    await waitFor(() => screen.getByText('저장하기'), { timeout: 5000 })
    expect(api.patch).not.toHaveBeenCalledWith('/users/me', expect.anything())
  })
})
