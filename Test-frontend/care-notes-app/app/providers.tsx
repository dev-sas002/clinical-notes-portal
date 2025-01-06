"use client"

import { Provider } from "react-redux"
import { useRef } from "react"
import { makeStore, type AppStore } from "../src/app/store"
import type { SessionUser } from "../src/types"

/**
 * Creates the store once per render tree, preloaded with the session the
 * server already resolved. No module-level singleton: a singleton would leak
 * one user's tenant into the next request during SSR.
 */
export function Providers({
  children,
  user,
}: {
  children: React.ReactNode
  user: SessionUser | null
}) {
  const storeRef = useRef<AppStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = makeStore({ session: { user } })
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}
