"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { careNotesApi } from "../api/careNotesAPI"
import { sessionCleared } from "../features/session/sessionSlice"
import { selectSessionUser } from "../features/careNotes/selectors"
import { useAppDispatch, useAppSelector } from "../hooks/useAppStore"
import { Button } from "../ui/Button"
import { cn } from "../ui/cn"

const LINKS = [
  { href: "/", label: "Care notes" },
  { href: "/dashboard", label: "Dashboard" },
]

/** Application header: where you are, which tenant you are in, and the way out. */
export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectSessionUser)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await careNotesApi.signOut()
    } finally {
      dispatch(sessionCleared())
      router.replace("/sign-in")
      router.refresh()
    }
  }

  return (
    <header className="border-b border-ink-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 rounded-md">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white"
          >
            CN
          </span>
          <span className="text-base font-semibold text-ink-900">Care Notes</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-ink-800">{user.tenantName}</p>
              <p className="text-xs text-ink-500">Signed in as {user.name}</p>
            </div>
          ) : null}
          <Link
            href="/add-note"
            className="inline-flex h-10 items-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            New note
          </Link>
          {user ? (
            <Button size="sm" variant="ghost" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
