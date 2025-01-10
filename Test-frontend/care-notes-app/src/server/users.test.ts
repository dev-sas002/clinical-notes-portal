import { afterEach, describe, expect, it } from "vitest"
import { DEMO_PASSWORD, authenticate, resetDirectoryCache, sha256 } from "./users"

afterEach(() => {
  delete process.env.CARE_NOTES_USERS
  resetDirectoryCache()
})

describe("authenticate", () => {
  it("returns the tenant claims for a valid demo account", () => {
    const claims = authenticate("a.rivera@northfield.example", DEMO_PASSWORD)

    expect(claims).toMatchObject({ tenantId: 1, tenantName: "Northfield Care Group" })
    expect(claims?.facilities.map((facility) => facility.id)).toEqual([11, 12, 13])
  })

  it("never leaks the stored password hash into the claims", () => {
    const claims = authenticate("a.rivera@northfield.example", DEMO_PASSWORD)

    expect(claims).not.toHaveProperty("passwordHash")
  })

  it("is case-insensitive on the email and tolerates padding", () => {
    expect(authenticate("  A.Rivera@Northfield.Example ", DEMO_PASSWORD)).not.toBeNull()
  })

  it("rejects a wrong password", () => {
    expect(authenticate("a.rivera@northfield.example", "nope")).toBeNull()
  })

  it("rejects an unknown account", () => {
    expect(authenticate("stranger@example.com", DEMO_PASSWORD)).toBeNull()
  })

  it("uses CARE_NOTES_USERS when it is configured", () => {
    process.env.CARE_NOTES_USERS = JSON.stringify([
      {
        email: "ward@example.org",
        password_sha256: sha256("s3cret"),
        name: "Ward Clerk",
        tenant_id: 42,
        tenant_name: "Configured Trust",
        facilities: [{ id: 421, name: "Ward A" }],
      },
    ])
    resetDirectoryCache()

    expect(authenticate("ward@example.org", "s3cret")).toMatchObject({ tenantId: 42 })
    // The built-in demo accounts must not survive a configured directory.
    expect(authenticate("a.rivera@northfield.example", DEMO_PASSWORD)).toBeNull()
  })
})
