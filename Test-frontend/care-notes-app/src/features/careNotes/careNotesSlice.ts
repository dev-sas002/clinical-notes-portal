import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type {
  CareNotesState,
  DateRange,
  PaginatedNotesResponse,
  Pagination,
  Resource,
} from "../../types"
import { createNote, fetchNotes, fetchStats } from "./careNotesThunks"

/**
 * Care notes data and the filters that shape it.
 *
 * Two deliberate decisions here:
 *
 * 1. Notes and stats each own their `status` and `error`. They used to share
 *    one `loading` flag, which made the note list flash a spinner every time
 *    the (independent) statistics poll fired.
 * 2. The tenant is not in this slice. It lives in `session`, arrives from the
 *    server, and cannot be changed from the browser.
 */

export const DEFAULT_PAGE_SIZE = 20

const idleResource = <T>(data: T): Resource<T> => ({
  data,
  status: "idle",
  error: null,
  requestId: null,
})

/**
 * Ignore a response that a newer request has already superseded.
 *
 * Changing the facility filter and the page size in quick succession fires
 * two loads; without this the slower first response lands last and quietly
 * restores the state the user has already moved on from.
 */
const isStale = <T>(resource: Resource<T>, requestId: string | undefined): boolean =>
  resource.requestId !== null && resource.requestId !== requestId

export const initialState: CareNotesState = {
  notes: idleResource([]),
  stats: idleResource(null),
  filters: {
    facilityIds: [],
    dateRange: "today",
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  },
  lastSync: null,
}

/** Map the API's snake_case pagination block onto our camelCase state. */
const toPagination = (response: PaginatedNotesResponse, fallback: Pagination): Pagination => {
  const meta = response.pagination
  if (!meta) return fallback
  return {
    currentPage: meta.page ?? fallback.currentPage,
    totalPages: meta.total_pages ?? fallback.totalPages,
    totalItems: meta.total ?? fallback.totalItems,
    pageSize: meta.page_size ?? fallback.pageSize,
  }
}

/**
 * A rejected thunk carries its message in `payload` when it used
 * rejectWithValue, and in `error.message` when it threw.
 */
const rejectionMessage = (
  action: { payload?: unknown; error?: { message?: string } },
  fallback: string,
): string => {
  const { payload } = action
  if (typeof payload === "string" && payload) return payload
  if (payload && typeof payload === "object" && "message" in payload) {
    const { message } = payload as { message?: unknown }
    if (typeof message === "string" && message) return message
  }
  return action.error?.message || fallback
}

const careNotesSlice = createSlice({
  name: "careNotes",
  initialState,
  reducers: {
    /** Narrow the view to a subset of the session's facilities. */
    facilityFilterChanged: (state, action: PayloadAction<number[]>) => {
      state.filters.facilityIds = action.payload
      state.pagination.currentPage = 1
    },
    /** Change the window the statistics panels summarise. */
    dateRangeChanged: (state, action: PayloadAction<DateRange>) => {
      state.filters.dateRange = action.payload
    },
    pageChanged: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = Math.max(1, action.payload)
    },
    pageSizeChanged: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = Math.max(1, action.payload)
      state.pagination.currentPage = 1
    },
    errorsCleared: (state) => {
      state.notes.error = null
      state.stats.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state, action) => {
        state.notes.status = "loading"
        state.notes.error = null
        state.notes.requestId = action.meta.requestId
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        if (isStale(state.notes, action.meta.requestId)) return
        state.notes.data = action.payload.notes ?? []
        state.notes.status = "succeeded"
        state.pagination = toPagination(action.payload, state.pagination)
        state.lastSync = new Date().toISOString()
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        if (isStale(state.notes, action.meta.requestId)) return
        state.notes.status = "failed"
        state.notes.error = rejectionMessage(action, "Could not load care notes.")
      })

      .addCase(fetchStats.pending, (state, action) => {
        state.stats.status = "loading"
        state.stats.error = null
        state.stats.requestId = action.meta.requestId
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        if (isStale(state.stats, action.meta.requestId)) return
        state.stats.data = action.payload
        state.stats.status = "succeeded"
        state.lastSync = new Date().toISOString()
      })
      .addCase(fetchStats.rejected, (state, action) => {
        if (isStale(state.stats, action.meta.requestId)) return
        state.stats.status = "failed"
        state.stats.error = rejectionMessage(action, "Could not load statistics.")
      })

      .addCase(createNote.fulfilled, (state, action) => {
        // Only page 1 shows the newest notes, so splicing elsewhere would put
        // the note in a position it does not really occupy.
        if (state.pagination.currentPage === 1) {
          state.notes.data.unshift(action.payload)
          if (state.notes.data.length > state.pagination.pageSize) state.notes.data.pop()
        }
        state.pagination.totalItems += 1
      })
      .addCase(createNote.rejected, (state, action) => {
        state.notes.error = rejectionMessage(action, "Could not save the note.")
      })
  },
})

export const {
  facilityFilterChanged,
  dateRangeChanged,
  pageChanged,
  pageSizeChanged,
  errorsCleared,
} = careNotesSlice.actions

export default careNotesSlice.reducer
