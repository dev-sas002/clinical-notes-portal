import { describe, expect, it } from "vitest"
import { computeVirtualRange } from "./useVirtualRange"

const options = { itemCount: 100, itemHeight: 140, viewportHeight: 620, overscan: 2 }

describe("computeVirtualRange", () => {
  it("starts at the top before any scrolling", () => {
    expect(computeVirtualRange(0, options)).toMatchObject({ startIndex: 0, offsetTop: 0 })
  })

  it("mounts far fewer rows than the page holds", () => {
    const { startIndex, endIndex } = computeVirtualRange(0, options)

    expect(endIndex - startIndex).toBeLessThan(options.itemCount / 2)
  })

  it("moves the window as the container scrolls", () => {
    const range = computeVirtualRange(140 * 20, options)

    expect(range.startIndex).toBe(18)
    expect(range.offsetTop).toBe(18 * 140)
  })

  it("keeps the scroll height honest so the scrollbar matches the data", () => {
    expect(computeVirtualRange(0, options).totalHeight).toBe(100 * 140)
  })

  it("never runs past the end of the list", () => {
    expect(computeVirtualRange(1_000_000, options).endIndex).toBeLessThanOrEqual(100)
  })

  it("clamps a negative scroll offset", () => {
    expect(computeVirtualRange(-500, options).startIndex).toBe(0)
  })

  it("handles an empty list without producing a negative index", () => {
    const range = computeVirtualRange(0, { ...options, itemCount: 0 })

    expect(range).toMatchObject({ startIndex: 0, endIndex: 0, totalHeight: 0 })
  })

  it("survives a zero item height instead of dividing by zero", () => {
    expect(
      Number.isFinite(computeVirtualRange(100, { ...options, itemHeight: 0 }).startIndex),
    ).toBe(true)
  })
})
