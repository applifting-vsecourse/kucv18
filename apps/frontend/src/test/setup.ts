import "@testing-library/jest-dom/vitest"

import { vi } from "vitest"

// jsdom has no ResizeObserver; Radix controls (switch, select) measure with it.
globalThis.ResizeObserver ??= class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
