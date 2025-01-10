import { beforeEach, describe, expect, it } from "vitest"
import { allowedFacilityIds, sealSession, unsealSession, type SessionClaims } from "./session"

const claims: SessionClaims = {
  sub: "u-test",
  name: "A. Rivera (RN)",
  tenantId: 7,
  tenantName: "Northfield Care Group",
  facilities: [
    { id: 11, name: "Northfield House" },
    { id: 12, name: "Elmwood Lodge" },
  ],
}

describe("session cookie", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "a-test-secret-long-enough-to-pass"
  })

  it("round-trips the claims it was given", async () => {
    const session = await unsealSession(await sealSession(claims))

    expect(session).toMatchObject({ sub: "u-test", tenantId: 7 })
    expect(session?.facilities).toHaveLength(2)
  })

  it("rejects a tampered payload", async () => {
    const [, signature] = (await sealSession(claims)).split(".")
    const forged = Buffer.from(
      JSON.stringify({ ...claims, tenantId: 999, exp: 2 ** 40 }),
    ).toString("base64url")

    expect(await unsealSession(`${forged}.${signature}`)).toBeNull()
  })

  it("rejects a session signed with a different secret", async () => {
    const cookie = await sealSession(claims)
    process.env.SESSION_SECRET = "a-completely-different-secret-value"

    expect(await unsealSession(cookie)).toBeNull()
  })

  it("rejects an expired session", async () => {
    const cookie = await sealSession(claims)
    const nineHoursLater = Date.now() + 9 * 60 * 60 * 1000

    expect(await unsealSession(cookie, nineHoursLater)).toBeNull()
  })

  it.each([undefined, null, "", "not-a-cookie", "only-one-part."])(
    "returns null for malformed value %s",
    async (value) => {
      expect(await unsealSession(value as string | undefined)).toBeNull()
    },
  )
})

describe("allowedFacilityIds", () => {
  const session = { ...claims, exp: Date.now() / 1000 + 60 }

  it("keeps only facilities the session grants", () => {
    expect(allowedFacilityIds(session, [11, 99, 12])).toEqual([11, 12])
  })

  it("drops every id when none are granted", () => {
    expect(allowedFacilityIds(session, [21, 22])).toEqual([])
  })
})
