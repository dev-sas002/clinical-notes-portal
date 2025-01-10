import { describe, expect, it } from "vitest"
import {
  PRIORITY_LEVELS,
  getCategoryBarClass,
  getCategoryLabel,
  getPriorityAccentClass,
  getPriorityBadgeClass,
  getPriorityBarClass,
  getPriorityLabel,
  toPercentage,
} from "./priority"

describe("priority labels", () => {
  it("treats 5 as the most urgent, matching the Add Note form's scale", () => {
    expect(getPriorityLabel(1)).toBe("Lowest")
    expect(getPriorityLabel(5)).toBe("Highest")
  })

  it("covers every level the form can produce", () => {
    for (const level of PRIORITY_LEVELS) {
      expect(getPriorityLabel(level)).not.toMatch(/^Priority /)
    }
  })

  it("degrades gracefully for an out-of-range priority", () => {
    expect(getPriorityLabel(9)).toBe("Priority 9")
    expect(getPriorityBadgeClass(9)).toBe("bg-ink-100 text-ink-600")
    expect(getPriorityBarClass(0)).toBe("bg-ink-400")
  })

  it("gives each level a distinct colour", () => {
    const bars = PRIORITY_LEVELS.map(getPriorityBarClass)
    expect(new Set(bars).size).toBe(PRIORITY_LEVELS.length)
  })
})

describe("toPercentage", () => {
  it("computes a plain share", () => {
    expect(toPercentage(25, 100)).toBe(25)
    expect(toPercentage(1, 4)).toBe(25)
  })

  it("returns 0 instead of NaN when the total is zero", () => {
    expect(toPercentage(0, 0)).toBe(0)
    expect(toPercentage(5, 0)).toBe(0)
  })

  it("rejects negative and non-finite totals", () => {
    expect(toPercentage(5, -10)).toBe(0)
    expect(toPercentage(Number.NaN, 10)).toBe(0)
    expect(toPercentage(5, Number.POSITIVE_INFINITY)).toBe(0)
  })

  it("clamps to the 0-100 range", () => {
    expect(toPercentage(150, 100)).toBe(100)
    expect(toPercentage(-5, 100)).toBe(0)
  })
})

describe("category tokens", () => {
  it("labels the three categories the backend accepts", () => {
    expect(getCategoryLabel("medication")).toBe("Medication")
    expect(getCategoryLabel("observation")).toBe("Observation")
    expect(getCategoryLabel("treatment")).toBe("Treatment")
  })

  it("passes an unknown category through unchanged", () => {
    expect(getCategoryLabel("nutrition")).toBe("nutrition")
  })

  it("gives each category a distinct bar colour", () => {
    const bars = ["medication", "observation", "treatment"].map(getCategoryBarClass)
    expect(new Set(bars).size).toBe(3)
  })
})

describe("priority accents", () => {
  it("gives each level a distinct card rule", () => {
    const accents = PRIORITY_LEVELS.map(getPriorityAccentClass)
    expect(new Set(accents).size).toBe(PRIORITY_LEVELS.length)
  })

  it("falls back for an out-of-range priority", () => {
    expect(getPriorityAccentClass(42)).toBe("border-l-ink-300")
  })
})
