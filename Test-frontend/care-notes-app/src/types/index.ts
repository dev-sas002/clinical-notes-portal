export type CareNoteCategory = "medication" | "observation" | "treatment"

export type CareNotePriority = 1 | 2 | 3 | 4 | 5

/**
 * Date window the stats endpoint understands. Declared here (rather than in a
 * component) so that the store and API layer do not have to import from the UI.
 */
export type DateRange = "today" | "this_week" | "this_month" | "this_year" | "all_time"

export interface CareNote {
  id: number
  tenant_id: number
  facility_id: number
  patient_id: string
  category: CareNoteCategory
  priority: CareNotePriority
  created_at: string
  created_by: string
  note_content: string
}

/**
 * What a user actually types. `tenant_id` and `facility_id` are deliberately
 * absent: the server derives them from the session, so the browser has no way
 * to write into another tenant.
 */
export interface CareNoteDraft {
  patient_id: string
  category: CareNoteCategory
  priority: CareNotePriority
  created_by: string
  note_content: string
}

/** The body the upstream FastAPI service accepts. Assembled server-side. */
export interface CareNoteInput extends CareNoteDraft {
  tenant_id: number
  facility_id: number
}

/** Shape returned by the `/api/care-stats` endpoint. */
export interface CareStats {
  total_notes: number
  by_category: Record<string, number>
  by_priority: Record<number, number>
  by_facility: Record<number, number>
  avg_notes_per_patient: number
  date_range: {
    start: string
    end: string
  }
}

/** Client-side pagination state (camelCase mirror of the API's snake_case block). */
export interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
}

export interface PaginatedNotesResponse {
  notes: CareNote[]
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
}

export interface Facility {
  id: number
  name: string
}

/**
 * The identity the server has already decided. It is mirrored into the store
 * read-only - nothing in the browser may change the tenant.
 */
export interface SessionUser {
  sub: string
  name: string
  tenantId: number
  tenantName: string
  facilities: Facility[]
}

export interface SessionState {
  user: SessionUser | null
}

/** One request status, used identically for every async resource. */
export type RequestStatus = "idle" | "loading" | "succeeded" | "failed"

export interface Resource<T> {
  data: T
  status: RequestStatus
  error: string | null
  /**
   * Request id of the most recent load. Responses that do not match it are
   * stale - see the note on out-of-order responses in the care notes slice.
   */
  requestId: string | null
}

export interface CareNotesFilters {
  /** Subset of the session's facilities; empty means "all of them". */
  facilityIds: number[]
  /** Window the statistics panels summarise. */
  dateRange: DateRange
}

export interface CareNotesState {
  notes: Resource<CareNote[]>
  stats: Resource<CareStats | null>
  filters: CareNotesFilters
  pagination: Pagination
  lastSync: string | null
}

export interface RootState {
  careNotes: CareNotesState
  session: SessionState
}
