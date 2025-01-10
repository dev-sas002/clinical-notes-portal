import { renderHook } from "@testing-library/react"
import { act } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { usePolling } from "./usePolling"

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  })
  document.dispatchEvent(new Event("visibilitychange"))
}

describe("usePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("does not fire before the first interval elapses", () => {
    const task = vi.fn()
    renderHook(() => usePolling(task, { intervalMs: 1000 }))

    expect(task).not.toHaveBeenCalled()
  })

  it("fires once per interval", () => {
    const task = vi.fn()
    renderHook(() => usePolling(task, { intervalMs: 1000 }))

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(task).toHaveBeenCalledTimes(3)
  })

  it("stops polling while the tab is hidden", () => {
    const task = vi.fn()
    renderHook(() => usePolling(task, { intervalMs: 1000 }))

    act(() => setVisibility("hidden"))
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(task).not.toHaveBeenCalled()
  })

  it("refreshes immediately when the tab comes back", () => {
    const task = vi.fn()
    renderHook(() => usePolling(task, { intervalMs: 1000 }))

    act(() => setVisibility("hidden"))
    act(() => setVisibility("visible"))

    expect(task).toHaveBeenCalledTimes(1)
  })

  it("does nothing at all when disabled", () => {
    const task = vi.fn()
    renderHook(() => usePolling(task, { intervalMs: 1000, enabled: false }))

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(task).not.toHaveBeenCalled()
  })

  it("clears its timer on unmount", () => {
    const task = vi.fn()
    const { unmount } = renderHook(() => usePolling(task, { intervalMs: 1000 }))

    unmount()
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(task).not.toHaveBeenCalled()
  })

  it("always calls the latest callback, not the one from first render", () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ task }) => usePolling(task, { intervalMs: 1000 }), {
      initialProps: { task: first },
    })

    rerender({ task: second })
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
