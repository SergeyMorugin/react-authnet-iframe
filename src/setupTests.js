import '@testing-library/jest-dom'

// Mock window.postMessage for iframe communication tests
Object.defineProperty(window, 'postMessage', {
  writable: true,
  value: jest.fn(),
})

// Mock iframe contentWindow
Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
  writable: true,
  value: {
    postMessage: jest.fn(),
  },
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

