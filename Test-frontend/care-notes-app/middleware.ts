import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE_NAME, unsealSession } from "./src/server/session"

/**
 * Single gate in front of every page and data route.
 *
 * Putting it here rather than in each handler means a new route is protected
 * by default: you have to add it to `PUBLIC_PATHS` to expose it, which is a
 * decision someone has to make deliberately.
 */

const PUBLIC_PATHS = ["/sign-in", "/api/session", "/healthz"]

const isPublic = (pathname: string): boolean =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  const session = await unsealSession(request.cookies.get(SESSION_COOKIE_NAME)?.value)
  if (session) return NextResponse.next()

  // Data routes get a status code; pages get a redirect that remembers where
  // the user was heading.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const signIn = request.nextUrl.clone()
  signIn.pathname = "/sign-in"
  signIn.search = ""
  if (pathname !== "/") signIn.searchParams.set("next", `${pathname}${search}`)
  return NextResponse.redirect(signIn)
}

export const config = {
  // Everything except Next's own assets and the favicon.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
