import type { Metadata } from "next"
import { cookies } from "next/headers"
import "./globals.css"
import { Navigation } from "../src/components/Navigation"
import { SESSION_COOKIE_NAME, unsealSession } from "../src/server/session"
import type { SessionUser } from "../src/types"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Care Notes",
  description: "Record and review care notes across facilities.",
}

/**
 * The session is resolved here, on the server, and handed to the store as
 * preloaded state. The browser therefore starts already knowing which tenant
 * it is in, and has no way to change it.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = await unsealSession(cookieStore.get(SESSION_COOKIE_NAME)?.value)

  const user: SessionUser | null = session
    ? {
        sub: session.sub,
        name: session.name,
        tenantId: session.tenantId,
        tenantName: session.tenantName,
        facilities: session.facilities,
      }
    : null

  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-50">
        <Providers user={user}>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          {user ? <Navigation /> : null}
          <main
            id="main"
            className={
              user
                ? "mx-auto max-w-6xl px-4 py-8 sm:px-6"
                : "flex min-h-screen items-center justify-center px-4 py-12"
            }
          >
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
