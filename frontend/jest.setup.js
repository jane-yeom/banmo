import '@testing-library/jest-dom'

// 모바일 viewport 시뮬레이션 (iPhone 14 Pro)
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 390,
})
Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 844,
})

// localStorage mock
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// fetch mock
global.fetch = jest.fn()

// alert/confirm/prompt mock (JSDOM에서 'Not implemented' 방지)
global.alert = jest.fn()
global.confirm = jest.fn(() => true)
global.prompt = jest.fn()

// matchMedia mock (JSDOM에서 지원 안 함)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// IntersectionObserver mock
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// ResizeObserver mock
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
