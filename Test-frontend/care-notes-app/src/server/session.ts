/**
 * Stateless, HMAC-signed session cookie.
 *
 * The signed payload carries the tenant and the facilities the signed-in user
 * is allowed to see. Every data request is scoped from *this* value, never
 * from anything the browser sends, which is what stops one tenant reading
 * another tenant's notes.
 *
 * Only Web Crypto is used so the exact same code runs in `middleware.ts`
 * (Edge runtime) and in the route handlers (Node runtime).
 */

import { sessionSecret, sessionTtlSeconds } from "./env"

export const SESSION_COOKIE_NAME = "care_notes_session"

export interface SessionFacility {
  id: number
  name: string
}

/** The identity the server trusts. Mirrored read-only into the Redux store. */
export interface Session {
  /** Stable user id. */
  sub: string
  /** Display name for the header. */
  name: string
  tenantId: number
  tenantName: string
  /** Every facility this user may read. Requests are intersected with it. */
  facilities: SessionFacility[]
  /** Expiry, seconds since epoch. */
  exp: number
}

export type SessionClaims = Omit<Session, "exp">

const encoder = new TextEncoder()

const subtle = (): SubtleCrypto => {
  const webcrypto = globalThis.crypto
  if (!webcrypto?.subtle) {
    throw new Error("Web Crypto is unavailable; cannot sign or verify sessions.")
  }
  return webcrypto.subtle
}

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const fromBase64Url = (value: string): Uint8Array => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

const signingKey = async (): Promise<CryptoKey> =>
  subtle().importKey(
    "raw",
    encoder.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )

/** Constant-time string comparison, so signatures cannot be probed byte by byte. */
const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

/** Serialise and sign a session. Returns the cookie value. */
export const sealSession = async (
  claims: SessionClaims,
  now: number = Date.now(),
): Promise<string> => {
  const session: Session = {
    ...claims,
    exp: Math.floor(now / 1000) + sessionTtlSeconds(),
  }
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)))
  const signature = new Uint8Array(
    await subtle().sign("HMAC", await signingKey(), encoder.encode(payload)),
  )
  return `${payload}.${toBase64Url(signature)}`
}

/**
 * Verify a cookie value. Returns `null` for anything that is missing,
 * malformed, badly signed or expired — callers never need to tell those
 * apart, and collapsing them avoids leaking which one it was.
 */
export const unsealSession = async (
  cookieValue: string | undefined | null,
  now: number = Date.now(),
): Promise<Session | null> => {
  if (!cookieValue) return null

  const [payload, signature] = cookieValue.split(".")
  if (!payload || !signature) return null

  let expected: string
  try {
    expected = toBase64Url(
      new Uint8Array(await subtle().sign("HMAC", await signingKey(), encoder.encode(payload))),
    )
  } catch {
    return null
  }
  if (!timingSafeEqual(signature, expected)) return null

  let session: Session
  try {
    session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as Session
  } catch {
    return null
  }

  if (typeof session?.tenantId !== "number" || !Array.isArray(session?.facilities)) return null
  if (typeof session.exp !== "number" || session.exp * 1000 <= now) return null

  return session
}

/** Cookie attributes shared by sign-in and sign-out. */
export const sessionCookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: maxAgeSeconds,
})

/**
 * Narrow a requested facility filter to the ones the session actually grants.
 * An empty result means "all facilities this session can see".
 */
export const allowedFacilityIds = (session: Session, requested: number[]): number[] => {
  const granted = new Set(session.facilities.map((facility) => facility.id))
  return requested.filter((id) => granted.has(id))
}
