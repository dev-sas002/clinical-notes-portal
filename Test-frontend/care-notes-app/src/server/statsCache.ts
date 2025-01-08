import type { CareStats } from "../types"
import type { StatsQuery } from "./gateways/types"

/**
 * Tiny TTL cache in front of the statistics aggregation.
 *
 * Every open tab re-polls `/api/care-stats` once a minute and the aggregate
 * is the most expensive query in the system, so N tabs on one ward produce N
 * identical scans. Collapsing them for a few seconds turns that back into
 * one. In-process only: this is a single-node convenience, not a substitute
 * for Redis in a multi-replica deployment (see README "Limitations").
 */

const DEFAULT_TTL_MS = 15_000

interface Entry {
  expiresAt: number
  value: Promise<CareStats>
}

export const statsCacheKey = (query: StatsQuery): string =>
  `${query.tenantId}|${[...query.facilityIds].sort((a, b) => a - b).join(",")}|${query.range}`

export class StatsCache {
  private entries = new Map<string, Entry>()

  constructor(
    private readonly ttlMs: number = DEFAULT_TTL_MS,
    private readonly now: () => number = Date.now,
  ) {}

  /**
   * Return a cached aggregate, or run `load` and cache it. The in-flight
   * promise is cached, not just its result, so concurrent pollers share one
   * upstream call rather than stampeding it.
   */
  async resolve(query: StatsQuery, load: () => Promise<CareStats>): Promise<CareStats> {
    const key = statsCacheKey(query)
    const existing = this.entries.get(key)
    if (existing && existing.expiresAt > this.now()) return existing.value

    const value = load()
    this.entries.set(key, { expiresAt: this.now() + this.ttlMs, value })

    try {
      return await value
    } catch (error) {
      // Never cache a failure: the next poll must be allowed to retry.
      this.entries.delete(key)
      throw error
    }
  }

  clear(): void {
    this.entries.clear()
  }
}

export const statsCache = new StatsCache()
