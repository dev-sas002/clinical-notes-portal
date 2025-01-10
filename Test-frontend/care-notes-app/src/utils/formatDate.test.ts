import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { formatDate, formatDateTime } from "./formatDate"

const NOW = new Date("2026-01-15T12:00:00.000Z")

const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString()

describe("formatDate", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Just now" for anything less than a minute old', () => {
    expect(formatDate(minutesAgo(0))).toBe("Just now")
    expect(formatDate(new Date(NOW.getTime() - 59_000).toISOString())).toBe("Just now")
  })

  it("treats a clock-skewed future timestamp as just now rather than negative minutes", () => {
    const future = new Date(NOW.getTime() + 5 * 60_000).toISOString()
    expect(formatDate(future)).toBe("Just now")
  })

  it("singularises exactly one minute and pluralises the rest", () => {
    expect(formatDate(minutesAgo(1))).toBe("1 minute ago")
    expect(formatDate(minutesAgo(2))).toBe("2 minutes ago")
    expect(formatDate(minutesAgo(59))).toBe("59 minutes ago")
  })

  it("switches to hours at the 60 minute boundary and truncates", () => {
    expect(formatDate(minutesAgo(60))).toBe("1 hour ago")
    expect(formatDate(minutesAgo(119))).toBe("1 hour ago")
    expect(formatDate(minutesAgo(120))).toBe("2 hours ago")
  })

  it("falls back to an absolute date once past 24 hours", () => {
    const result = formatDate(minutesAgo(1440))
    expect(result).not.toMatch(/ago/)
    expect(result).toMatch(/Jan/)
  })

  it("does not render the string 'Invalid Date' for unparseable input", () => {
    expect(formatDate("not-a-date")).toBe("Unknown date")
    expect(formatDate("")).toBe("Unknown date")
  })
})

describe("formatDateTime", () => {
  it("includes the year", () => {
    expect(formatDateTime("2026-01-15T09:30:00.000Z")).toMatch(/2026/)
  })

  it("guards unparseable input", () => {
    expect(formatDateTime("nope")).toBe("Unknown date")
  })
})
