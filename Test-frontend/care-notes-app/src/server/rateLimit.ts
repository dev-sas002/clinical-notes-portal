/**
 * Fixed-window attempt limiter for the sign-in route.
 *
 * In-process and therefore per-replica: enough to blunt a script hammering a
 * single instance, not a substitute for a shared limiter at the edge. Said
 * plainly in the README rather than implied to be more than it is.
 */
export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>()

  constructor(
    private readonly limit = 10,
    private readonly windowMs = 60_000,
    private readonly now: () => number = Date.now,
  ) {}

  /** Record an attempt. Returns false once the key is over its budget. */
  take(key: string): boolean {
    const current = this.hits.get(key)
    const timestamp = this.now()

    if (!current || current.resetAt <= timestamp) {
      this.hits.set(key, { count: 1, resetAt: timestamp + this.windowMs })
      return true
    }

    current.count += 1
    return current.count <= this.limit
  }

  /** Forget a key, e.g. after a successful sign-in. */
  reset(key: string): void {
    this.hits.delete(key)
  }
}

export const signInLimiter = new RateLimiter()
