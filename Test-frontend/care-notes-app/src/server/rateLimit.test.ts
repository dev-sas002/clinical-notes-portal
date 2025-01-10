import { describe, expect, it } from "vitest"
import { RateLimiter } from "./rateLimit"

describe("RateLimiter", () => {
  it("allows attempts up to the limit", () => {
    const limiter = new RateLimiter(3, 1000, () => 0)

    expect([limiter.take("a"), limiter.take("a"), limiter.take("a")]).toEqual([
      true,
      true,
      true,
    ])
  })

  it("blocks once the limit is exceeded", () => {
    const limiter = new RateLimiter(2, 1000, () => 0)
    limiter.take("a")
    limiter.take("a")

    expect(limiter.take("a")).toBe(false)
  })

  it("tracks keys independently", () => {
    const limiter = new RateLimiter(1, 1000, () => 0)
    limiter.take("a")

    expect(limiter.take("b")).toBe(true)
  })

  it("opens a new window once the old one lapses", () => {
    let now = 0
    const limiter = new RateLimiter(1, 1000, () => now)
    limiter.take("a")
    now = 2000

    expect(limiter.take("a")).toBe(true)
  })

  it("forgets a key on reset", () => {
    const limiter = new RateLimiter(1, 1000, () => 0)
    limiter.take("a")
    limiter.reset("a")

    expect(limiter.take("a")).toBe(true)
  })
})
