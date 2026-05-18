import '@testing-library/jest-dom/vitest'

class ResizeObserverMock implements ResizeObserver {
  observe() {
    // No-op for jsdom tests.
  }

  unobserve() {
    // No-op for jsdom tests.
  }

  disconnect() {
    // No-op for jsdom tests.
  }
}

globalThis.ResizeObserver = ResizeObserverMock

HTMLCanvasElement.prototype.getContext = (() => null) as HTMLCanvasElement['getContext']
