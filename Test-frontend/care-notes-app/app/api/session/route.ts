import { NextResponse, type NextRequest } from "next/server"
import { sessionTtlSeconds } from "../../../src/server/env"
import { signInLimiter } from "../../../src/server/rateLimit"
import {
  SESSION_COOKIE_NAME,
  sealSession,
  sessionCookieOptions,
  unsealSession,
} from "../../../src/server/session"
import { authenticate } from "../../../src/server/users"
import type { SessionUser } from "../../../src/types"

export const dynamic = "force-dynamic"

const clientKey = (request: NextRequest): string =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

/** The subset of the session the browser is allowed to know about. */
const toSessionUser = (claims: {
  sub: string
  name: string
  tenantId: number
  tenantName: string
  facilities: Array<{ id: number; name: string }>
}): SessionUser => ({
  sub: claims.sub,
  name: claims.name,
  tenantId: claims.tenantId,
  tenantName: claims.tenantName,
  facilities: claims.facilities,
})

/** Who am I? Used by the client to rehydrate after a cold navigation. */
export async function GET(request: NextRequest) {
  const session = await unsealSession(request.cookies.get(SESSION_COOKIE_NAME)?.value)
  if (!session) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({ user: toSessionUser(session) })
}

/** Sign in. On success the tenant is sealed into an httpOnly cookie. */
export async function POST(request: NextRequest) {
  if (!signInLimiter.take(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again in a minute." },
      { status: 429 },
    )
  }

  let body: { email?: unknown; password?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email : ""
  const password = typeof body.password === "string" ? body.password : ""

  const claims = email && password ? authenticate(email, password) : null
  if (!claims) {
    // One message for both failures: do not confirm which emails exist.
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 })
  }

  signInLimiter.reset(clientKey(request))

  const response = NextResponse.json({ user: toSessionUser(claims) })
  response.cookies.set(
    SESSION_COOKIE_NAME,
    await sealSession(claims),
    sessionCookieOptions(sessionTtlSeconds()),
  )
  return response
}

/** Sign out by expiring the cookie. */
export async function DELETE() {
  const response = NextResponse.json({ user: null })
  response.cookies.set(SESSION_COOKIE_NAME, "", sessionCookieOptions(0))
  return response
}
