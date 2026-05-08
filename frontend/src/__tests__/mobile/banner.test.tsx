import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}))

import { HeroBanner } from '@/components/HeroBanner'

describe('슬라이딩 배너', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('첫 번째 배너가 렌더링된다', () => {
    render(<HeroBanner />)
    expect(screen.getByText('반주자를 찾고 계신가요?')).toBeInTheDocument()
    expect(screen.getByText('피아노, 바이올린, 첼로 등 다양한 반주자를 만나보세요')).toBeInTheDocument()
  })

  it('다음 버튼(›) 클릭시 두 번째 배너로 이동한다', () => {
    render(<HeroBanner />)
    act(() => {
      fireEvent.click(screen.getByLabelText('다음'))
    })
    expect(screen.getByText('반주 활동을 원하시나요?')).toBeInTheDocument()
  })

  it('이전 버튼(‹) 클릭시 마지막 배너로 이동한다', () => {
    render(<HeroBanner />)
    act(() => {
      fireEvent.click(screen.getByLabelText('이전'))
    })
    expect(screen.getByText('공연을 홍보해보세요')).toBeInTheDocument()
  })

  it('4초 후 자동으로 두 번째 배너로 이동한다', () => {
    render(<HeroBanner />)
    act(() => {
      jest.advanceTimersByTime(4000)
    })
    expect(screen.getByText('반주 활동을 원하시나요?')).toBeInTheDocument()
  })

  it('8초 후 세 번째 배너로 이동한다', () => {
    render(<HeroBanner />)
    // 4초 + 애니메이션(400ms) + 4초
    act(() => {
      jest.advanceTimersByTime(4400)
    })
    act(() => {
      jest.advanceTimersByTime(4000)
    })
    expect(screen.getByText('공연을 홍보해보세요')).toBeInTheDocument()
  })

  it('dot 인디케이터 3번째 클릭시 세 번째 배너로 이동한다', () => {
    render(<HeroBanner />)
    const dots = screen.getAllByLabelText(/슬라이드/)
    act(() => {
      fireEvent.click(dots[2])
    })
    expect(screen.getByText('공연을 홍보해보세요')).toBeInTheDocument()
  })

  it('dot 인디케이터 2번째 클릭시 두 번째 배너로 이동한다', () => {
    render(<HeroBanner />)
    const dots = screen.getAllByLabelText(/슬라이드/)
    act(() => {
      fireEvent.click(dots[1])
    })
    expect(screen.getByText('반주 활동을 원하시나요?')).toBeInTheDocument()
  })

  it('터치 스와이프 (왼쪽) 로 다음 배너로 이동한다', () => {
    render(<HeroBanner />)
    const banner = screen.getByTestId('hero-banner')
    act(() => {
      fireEvent.touchStart(banner, { touches: [{ clientX: 300 }] })
      fireEvent.touchEnd(banner, { changedTouches: [{ clientX: 200 }] })
    })
    expect(screen.getByText('반주 활동을 원하시나요?')).toBeInTheDocument()
  })

  it('터치 스와이프 (오른쪽) 로 이전 배너로 이동한다', () => {
    render(<HeroBanner />)
    const banner = screen.getByTestId('hero-banner')
    // 먼저 다음으로 이동
    act(() => {
      fireEvent.click(screen.getByLabelText('다음'))
    })
    // 애니메이션 완료 대기 (400ms)
    act(() => {
      jest.advanceTimersByTime(500)
    })
    // 오른쪽 스와이프로 이전으로
    act(() => {
      fireEvent.touchStart(banner, { touches: [{ clientX: 100 }] })
      fireEvent.touchEnd(banner, { changedTouches: [{ clientX: 250 }] })
    })
    expect(screen.getByText('반주자를 찾고 계신가요?')).toBeInTheDocument()
  })

  it('각 배너에 올바른 링크가 있다', () => {
    render(<HeroBanner />)
    expect(screen.getByText('구인 공고 보기 →')).toBeInTheDocument()
  })

  it('세 개의 dot 인디케이터가 렌더링된다', () => {
    render(<HeroBanner />)
    const dots = screen.getAllByLabelText(/슬라이드/)
    expect(dots).toHaveLength(3)
  })
})
