import "@testing-library/jest-dom/vitest"
import { webcrypto } from "node:crypto"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

/**
 * next/navigation is only available inside a Next.js render tree; components
 * under test get a stub router instead.
 */
export const routerMock = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}

export const searchParamsMock = new URLSearchParams()

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/",
  useSearchParams: () => searchParamsMock,
}))

// jsdom ships a `crypto` without `subtle`; the session module needs it.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true })
}

afterEach(() => {
  cleanup()
  Object.values(routerMock).forEach((fn) => fn.mockClear())
})
