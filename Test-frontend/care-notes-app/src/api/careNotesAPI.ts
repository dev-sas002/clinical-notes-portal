import type {
  CareNote,
  CareNoteDraft,
  CareStats,
  DateRange,
  PaginatedNotesResponse,
  SessionUser,
} from "../types"
import type { NoteFieldErrors } from "../utils/validateNote"

/**
 * Browser-side client for this app's own API.
 *
 * Every call is same-origin: the browser talks to the Next route handlers,
 * which hold the session and the upstream URL. There is deliberately no
 * `NEXT_PUBLIC_API_URL` any more - the backend address is not something a
 * client bundle should carry, and the tenant is not something it should send.
 */

export const API_BASE_URL = "/api"

export const DEFAULT_PAGE_SIZE = 20

/** A non-2xx answer from our own API. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: NoteFieldErrors = {},
  ) {
    super(message)
    this.name = "ApiError"
  }

  /** True when the user must sign in again. */
  get isUnauthenticated(): boolean {
    return this.status === 401
  }
}

interface ErrorBody {
  error?: string
  fields?: NoteFieldErrors
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "same-origin",
      ...init,
    })
  } catch (cause) {
    throw new ApiError(
      `Could not reach the server: ${cause instanceof Error ? cause.message : String(cause)}`,
      0,
    )
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorBody
    throw new ApiError(
      body.error || `Request failed (${response.status}).`,
      response.status,
      body.fields ?? {},
    )
  }

  return (await response.json()) as T
}

const facilityParam = (params: URLSearchParams, facilityIds: number[] | undefined) => {
  if (facilityIds?.length) params.set("facility_ids", facilityIds.join(","))
}

export interface ListNotesParams {
  page?: number
  pageSize?: number
  facilityIds?: number[]
}

export interface StatsParams {
  range: DateRange
  facilityIds?: number[]
}

export const careNotesApi = {
  listNotes({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    facilityIds,
  }: ListNotesParams = {}): Promise<PaginatedNotesResponse> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    facilityParam(params, facilityIds)
    return request<PaginatedNotesResponse>(`/care-notes?${params}`)
  },

  getStats({ range, facilityIds }: StatsParams): Promise<CareStats> {
    const params = new URLSearchParams({ range })
    facilityParam(params, facilityIds)
    return request<CareStats>(`/care-stats?${params}`)
  },

  createNote(draft: CareNoteDraft, facilityId?: number): Promise<CareNote> {
    return request<CareNote>("/care-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(facilityId == null ? draft : { ...draft, facility_id: facilityId }),
    })
  },

  signIn(email: string, password: string): Promise<{ user: SessionUser }> {
    return request<{ user: SessionUser }>("/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  },

  signOut(): Promise<{ user: null }> {
    return request<{ user: null }>("/session", { method: "DELETE" })
  },
}
