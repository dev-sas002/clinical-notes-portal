/**
 * User directory used by the sign-in route.
 *
 * This is deliberately a *small, replaceable* directory rather than a real
 * identity system: the take-home's scope is the care-notes UI, not an IdP.
 * What matters architecturally is that the tenant a user belongs to is
 * decided here, on the server, and sealed into the session cookie - swapping
 * this file for an OIDC or SAML callback does not touch anything else.
 */

import { createHash, timingSafeEqual } from "node:crypto"
import { isDemoMode } from "./env"
import type { SessionClaims } from "./session"

export interface DirectoryUser extends SessionClaims {
  /** SHA-256 hex digest of the password. */
  passwordHash: string
}

export const sha256 = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex")

/**
 * Accounts used when no directory is configured. They exist so that
 * `docker compose up` gives a reviewer something to sign in to; they are
 * advertised on the sign-in page only while the demo data source is active.
 */
export const DEMO_PASSWORD = "demo-pass"

export const DEMO_ACCOUNTS: Array<{ email: string; user: DirectoryUser }> = [
  {
    email: "a.rivera@northfield.example",
    user: {
      sub: "u-rivera",
      name: "A. Rivera (RN)",
      tenantId: 1,
      tenantName: "Northfield Care Group",
      facilities: [
        { id: 11, name: "Northfield House" },
        { id: 12, name: "Elmwood Lodge" },
        { id: 13, name: "Brookvale Court" },
      ],
      passwordHash: sha256(DEMO_PASSWORD),
    },
  },
  {
    email: "j.okafor@lakeside.example",
    user: {
      sub: "u-okafor",
      name: "J. Okafor (RN)",
      tenantId: 2,
      tenantName: "Lakeside Homes",
      facilities: [
        { id: 21, name: "Lakeside Manor" },
        { id: 22, name: "Harbour View" },
      ],
      passwordHash: sha256(DEMO_PASSWORD),
    },
  },
]

/** Accounts the sign-in page may show as a hint (demo data source only). */
export const demoCredentials = (): Array<{ email: string; tenantName: string }> =>
  isDemoMode()
    ? DEMO_ACCOUNTS.map(({ email, user }) => ({ email, tenantName: user.tenantName }))
    : []

interface ConfiguredUser {
  email: string
  password_sha256: string
  sub?: string
  name: string
  tenant_id: number
  tenant_name: string
  facilities: Array<{ id: number; name: string }>
}

/**
 * Parse `CARE_NOTES_USERS`: a JSON array of accounts. Invalid JSON is fatal
 * rather than silently ignored - a typo there would otherwise fall back to
 * the demo accounts in production.
 */
const configuredDirectory = (raw: string): Map<string, DirectoryUser> => {
  const parsed = JSON.parse(raw) as ConfiguredUser[]
  if (!Array.isArray(parsed)) throw new Error("CARE_NOTES_USERS must be a JSON array.")

  return new Map(
    parsed.map((user) => [
      user.email.trim().toLowerCase(),
      {
        sub: user.sub ?? user.email,
        name: user.name,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
        facilities: user.facilities ?? [],
        passwordHash: user.password_sha256.toLowerCase(),
      },
    ]),
  )
}

let cached: Map<string, DirectoryUser> | null = null
let cachedFrom: string | null = null

const directory = (): Map<string, DirectoryUser> => {
  const raw = process.env.CARE_NOTES_USERS?.trim() ?? ""
  if (cached && cachedFrom === raw) return cached

  cached = raw
    ? configuredDirectory(raw)
    : new Map(DEMO_ACCOUNTS.map(({ email, user }) => [email, user]))
  cachedFrom = raw
  return cached
}

/** Forget any parsed directory. Used by tests that swap the environment. */
export const resetDirectoryCache = (): void => {
  cached = null
  cachedFrom = null
}

const digestsMatch = (a: string, b: string): boolean => {
  const left = Buffer.from(a, "hex")
  const right = Buffer.from(b, "hex")
  return left.length === right.length && timingSafeEqual(left, right)
}

/**
 * Return the claims to seal into a session, or `null` if the credentials do
 * not match. Unknown emails still run a hash comparison so that response
 * timing does not distinguish "no such user" from "wrong password".
 */
export const authenticate = (email: string, password: string): SessionClaims | null => {
  const user = directory().get(email.trim().toLowerCase())
  const candidate = sha256(password)
  const reference = user?.passwordHash ?? sha256("no-such-user")

  if (!digestsMatch(candidate, reference) || !user) return null

  const { passwordHash: _passwordHash, ...claims } = user
  return claims
}
