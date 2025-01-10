import { describe, expect, it, vi } from "vitest"
import { StatsCache, statsCacheKey } from "./statsCache"
import { makeStats } from "../test/factories"
import type { StatsQuery } from "./gateways/types"

const query: StatsQuery = { tenantId: 1, facilityIds: [12, 11], range: "today" }

describe("statsCacheKey", () => {
  it("is stable regardless of facility order", () => {
    expect(statsCacheKey(query)).toBe(statsCacheKey({ ...query, facilityIds: [11, 12] }))
  })

  it("separates tenants", () => {
    expect(statsCacheKey(query)).not.toBe(statsCacheKey({ ...query, tenantId: 2 }))
  })

  it("separates date ranges", () => {
    expect(statsCacheKey(query)).not.toBe(statsCacheKey({ ...query, range: "this_week" }))
  })
})

describe("StatsCache", () => {
  it("serves a repeated query from the cache", async () => {
    const cache = new StatsCache(1000, () => 0)
    const load = vi.fn().mockResolvedValue(makeStats())

    await cache.resolve(query, load)
    await cache.resolve(query, load)

    expect(load).toHaveBeenCalledTimes(1)
  })

  it("collapses concurrent pollers onto one upstream call", async () => {
    const cache = new StatsCache(1000, () => 0)
    const load = vi.fn().mockResolvedValue(makeStats())

    await Promise.all([cache.resolve(query, load), cache.resolve(query, load)])

    expect(load).toHaveBeenCalledTimes(1)
  })

  it("reloads once the entry has expired", async () => {
    let now = 0
    const cache = new StatsCache(100, () => now)
    const load = vi.fn().mockResolvedValue(makeStats())

    await cache.resolve(query, load)
    now = 500
    await cache.resolve(query, load)

    expect(load).toHaveBeenCalledTimes(2)
  })

  it("does not cache a failure", async () => {
    const cache = new StatsCache(1000, () => 0)
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("upstream down"))
      .mockResolvedValue(makeStats())

    await expect(cache.resolve(query, load)).rejects.toThrow("upstream down")
    await expect(cache.resolve(query, load)).resolves.toMatchObject({ total_notes: 10 })
    expect(load).toHaveBeenCalledTimes(2)
  })
})
