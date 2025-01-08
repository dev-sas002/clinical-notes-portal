import type { DateRange } from "../types"
import { allowedFacilityIds, type Session } from "./session"

/**
 * Query-string parsing for the route handlers.
 *
 * Kept free of `next/server` imports so it can be unit-tested directly, and
 * so the "narrow the request to what the session allows" rule lives in one
 * readable place.
 */

export const MAX_PAGE_SIZE = 100
export const DEFAULT_PAGE_SIZE = 20

const DATE_RANGES: DateRange[] = ["today", "this_week", "this_month", "this_year", "all_time"]

const parsePositiveInt = (value: string | null, fallback: number, max?: number): number => {
  const parsed = Number.parseInt(value ?? "", 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return max ? Math.min(parsed, max) : parsed
}

export const parsePage = (params: URLSearchParams): number =>
  parsePositiveInt(params.get("page"), 1)

export const parsePageSize = (params: URLSearchParams): number =>
  parsePositiveInt(params.get("page_size"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

export const parseDateRange = (params: URLSearchParams): DateRange => {
  const raw = params.get("range") as DateRange | null
  return raw && DATE_RANGES.includes(raw) ? raw : "today"
}

/**
 * Facility filter for this request: whatever the client asked for, narrowed
 * to the facilities the session grants. An unauthorised id is dropped rather
 * than rejected, so a stale bookmark degrades instead of erroring.
 */
export const parseFacilityIds = (params: URLSearchParams, session: Session): number[] => {
  const requested = (params.get("facility_ids") ?? "")
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value))

  return allowedFacilityIds(session, requested)
}
