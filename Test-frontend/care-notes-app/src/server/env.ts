/**
 * Server-only configuration.
 *
 * Nothing in this module may be imported from a client component: the values
 * here (backend URL, session secret, user directory) must never be inlined
 * into the browser bundle. That is the whole point of the BFF layer — see
 * `docs`/README "Design notes".
 */

export type DataSourceName = "http" | "demo"

const DEV_SESSION_SECRET = "care-notes-dev-secret-not-for-production"

/** Upstream FastAPI service. Server-side only — never `NEXT_PUBLIC_`. */
export const backendUrl = (): string =>
  (process.env.CARE_NOTES_API_URL || "http://localhost:8000").replace(/\/+$/, "")

/**
 * Which gateway implementation serves data. `demo` runs entirely in-process
 * against seeded synthetic data, which is what the Docker image and the
 * screenshot capture use so neither needs the backend running.
 */
export const dataSourceName = (): string => process.env.CARE_NOTES_DATA_SOURCE?.trim() || "demo"

/** True when the app is allowed to advertise its demo credentials. */
export const isDemoMode = (): boolean => dataSourceName() === "demo"

/**
 * HMAC key for the session cookie. A missing secret is fatal in production;
 * in development we fall back to a fixed development key so `npm run dev`
 * works with no configuration, and say so once.
 */
export const sessionSecret = (): string => {
  const configured = process.env.SESSION_SECRET
  if (configured && configured.length >= 16) return configured

  if (process.env.NODE_ENV === "production" && !isDemoMode()) {
    throw new Error(
      "SESSION_SECRET must be set (32+ random characters) when running in production.",
    )
  }
  return configured || DEV_SESSION_SECRET
}

/** Session lifetime in seconds. */
export const sessionTtlSeconds = (): number => {
  const raw = Number(process.env.SESSION_TTL_SECONDS)
  return Number.isFinite(raw) && raw > 0 ? raw : 60 * 60 * 8
}
