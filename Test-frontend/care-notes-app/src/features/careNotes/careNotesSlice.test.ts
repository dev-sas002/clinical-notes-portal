import { describe, expect, it } from "vitest"
import reducer, {
  dateRangeChanged,
  errorsCleared,
  facilityFilterChanged,
  initialState,
  pageChanged,
  pageSizeChanged,
} from "./careNotesSlice"
import { createNote, fetchNotes, fetchStats } from "./careNotesThunks"
import { makeNote, makePaginatedResponse, makeStats } from "../../test/factories"

const state = (overrides: Partial<typeof initialState> = {}) => ({
  ...initialState,
  ...overrides,
})

/** Action envelopes matching what createAsyncThunk really dispatches. */
const meta = (requestId = "req-1") => ({ requestId })

const pending = (thunk: { pending: { type: string } }, requestId?: string) => ({
  type: thunk.pending.type,
  meta: meta(requestId),
})

const fulfilled = (
  thunk: { fulfilled: { type: string } },
  payload: unknown,
  requestId?: string,
) => ({ type: thunk.fulfilled.type, payload, meta: meta(requestId) })

const rejected = (
  thunk: { rejected: { type: string } },
  extra: { payload?: unknown; error?: { message?: string } },
  requestId?: string,
) => ({ type: thunk.rejected.type, meta: meta(requestId), ...extra })

describe("careNotes reducers", () => {
  it("starts with nothing loaded and no error", () => {
    expect(initialState.notes).toMatchObject({ data: [], status: "idle", error: null })
    expect(initialState.stats).toMatchObject({ data: null, status: "idle" })
  })

  it("has no tenant field at all - the tenant belongs to the session", () => {
    expect(initialState).not.toHaveProperty("selectedTenantId")
  })

  it("stores a facility filter and returns to page 1", () => {
    const next = reducer(
      state({ pagination: { ...initialState.pagination, currentPage: 4 } }),
      facilityFilterChanged([11, 12]),
    )

    expect(next.filters.facilityIds).toEqual([11, 12])
    expect(next.pagination.currentPage).toBe(1)
  })

  it("changes the stats period without disturbing the page", () => {
    const next = reducer(
      state({ pagination: { ...initialState.pagination, currentPage: 3 } }),
      dateRangeChanged("this_month"),
    )

    expect(next.filters.dateRange).toBe("this_month")
    expect(next.pagination.currentPage).toBe(3)
  })

  it("refuses a page below 1", () => {
    expect(reducer(initialState, pageChanged(-5)).pagination.currentPage).toBe(1)
  })

  it("resets to page 1 when the page size changes", () => {
    const next = reducer(
      state({ pagination: { ...initialState.pagination, currentPage: 6 } }),
      pageSizeChanged(100),
    )

    expect(next.pagination).toMatchObject({ pageSize: 100, currentPage: 1 })
  })

  it("clears both resource errors at once", () => {
    const next = reducer(
      state({
        notes: { data: [], status: "failed", error: "boom", requestId: null },
        stats: { data: null, status: "failed", error: "bang", requestId: null },
      }),
      errorsCleared(),
    )

    expect(next.notes.error).toBeNull()
    expect(next.stats.error).toBeNull()
  })
})

describe("fetchNotes lifecycle", () => {
  it("marks only the notes resource as loading", () => {
    const next = reducer(initialState, pending(fetchNotes))

    expect(next.notes.status).toBe("loading")
    expect(next.stats.status).toBe("idle")
  })

  it("stores the page and maps snake_case pagination", () => {
    const payload = makePaginatedResponse({
      notes: [makeNote({ id: 5 })],
      pagination: { total: 42, page: 2, page_size: 20, total_pages: 3 },
    })
    const next = reducer(initialState, fulfilled(fetchNotes, payload))

    expect(next.notes.data).toHaveLength(1)
    expect(next.pagination).toMatchObject({
      currentPage: 2,
      totalPages: 3,
      totalItems: 42,
      pageSize: 20,
    })
    expect(next.lastSync).not.toBeNull()
  })

  it("keeps the previous pagination when the response omits the block", () => {
    const seeded = reducer(
      initialState,
      fulfilled(
        fetchNotes,
        makePaginatedResponse({
          pagination: { total: 9, page: 2, page_size: 20, total_pages: 5 },
        }),
      ),
    )
    const next = reducer(seeded, fulfilled(fetchNotes, { notes: [] }))

    expect(next.pagination.totalPages).toBe(5)
  })

  it("records the rejection message on the notes resource only", () => {
    const next = reducer(
      initialState,
      rejected(fetchNotes, { payload: "Could not reach the server" }),
    )

    expect(next.notes).toMatchObject({ status: "failed", error: "Could not reach the server" })
    expect(next.stats.error).toBeNull()
  })

  it("falls back to the thrown error message", () => {
    const next = reducer(
      initialState,
      rejected(fetchNotes, { error: { message: "network down" } }),
    )

    expect(next.notes.error).toBe("network down")
  })
})

describe("fetchStats lifecycle", () => {
  it("does not blank the note list while stats reload", () => {
    const seeded = reducer(initialState, fulfilled(fetchNotes, makePaginatedResponse()))
    const next = reducer(seeded, pending(fetchStats))

    expect(next.notes.data).toHaveLength(1)
    expect(next.notes.status).toBe("succeeded")
  })

  it("stores the aggregate", () => {
    const next = reducer(initialState, fulfilled(fetchStats, makeStats({ total_notes: 77 })))

    expect(next.stats.data?.total_notes).toBe(77)
    expect(next.stats.status).toBe("succeeded")
  })

  it("records a stats failure separately from notes", () => {
    const next = reducer(initialState, rejected(fetchStats, { payload: "stats unavailable" }))

    expect(next.stats).toMatchObject({ status: "failed", error: "stats unavailable" })
    expect(next.notes.status).toBe("idle")
  })
})

describe("createNote lifecycle", () => {
  it("prepends the new note when the user is on page 1", () => {
    const seeded = reducer(
      initialState,
      fulfilled(fetchNotes, makePaginatedResponse({ notes: [makeNote({ id: 1 })] })),
    )
    const next = reducer(seeded, fulfilled(createNote, makeNote({ id: 99 })))

    expect(next.notes.data[0].id).toBe(99)
    expect(next.pagination.totalItems).toBe(2)
  })

  it("does not splice the note into a page it does not belong on", () => {
    const seeded = reducer(
      initialState,
      fulfilled(
        fetchNotes,
        makePaginatedResponse({
          notes: [makeNote({ id: 1 })],
          pagination: { total: 40, page: 2, page_size: 20, total_pages: 2 },
        }),
      ),
    )
    const next = reducer(seeded, fulfilled(createNote, makeNote({ id: 99 })))

    expect(next.notes.data.map((note) => note.id)).toEqual([1])
    expect(next.pagination.totalItems).toBe(41)
  })

  it("keeps the page at its declared size", () => {
    const notes = Array.from({ length: 20 }, (_, index) => makeNote({ id: index + 1 }))
    const seeded = reducer(
      initialState,
      fulfilled(
        fetchNotes,
        makePaginatedResponse({
          notes,
          pagination: { total: 100, page: 1, page_size: 20, total_pages: 5 },
        }),
      ),
    )
    const next = reducer(seeded, fulfilled(createNote, makeNote({ id: 500 })))

    expect(next.notes.data).toHaveLength(20)
  })

  it("surfaces a save failure on the notes resource", () => {
    const next = reducer(
      initialState,
      rejected(createNote, { payload: { message: "Could not save the note.", fields: {} } }),
    )

    expect(next.notes.error).toBe("Could not save the note.")
  })
})

describe("out-of-order responses", () => {
  it("ignores a superseded notes response", () => {
    const first = reducer(initialState, pending(fetchNotes, "req-a"))
    const second = reducer(first, pending(fetchNotes, "req-b"))
    const latest = reducer(
      second,
      fulfilled(
        fetchNotes,
        makePaginatedResponse({
          notes: [makeNote({ id: 2 })],
          pagination: { total: 1, page: 1, page_size: 100, total_pages: 1 },
        }),
        "req-b",
      ),
    )

    // The slow first request lands last and must be discarded.
    const afterStale = reducer(
      latest,
      fulfilled(
        fetchNotes,
        makePaginatedResponse({
          notes: [makeNote({ id: 1 })],
          pagination: { total: 1, page: 1, page_size: 20, total_pages: 1 },
        }),
        "req-a",
      ),
    )

    expect(afterStale.notes.data.map((note) => note.id)).toEqual([2])
    expect(afterStale.pagination.pageSize).toBe(100)
  })

  it("ignores a superseded notes rejection", () => {
    const pendingB = reducer(
      reducer(initialState, pending(fetchNotes, "req-a")),
      pending(fetchNotes, "req-b"),
    )
    const ok = reducer(pendingB, fulfilled(fetchNotes, makePaginatedResponse(), "req-b"))
    const afterStale = reducer(ok, rejected(fetchNotes, { payload: "too late" }, "req-a"))

    expect(afterStale.notes.status).toBe("succeeded")
    expect(afterStale.notes.error).toBeNull()
  })

  it("ignores a superseded stats response", () => {
    const pendingB = reducer(
      reducer(initialState, pending(fetchStats, "req-a")),
      pending(fetchStats, "req-b"),
    )
    const ok = reducer(pendingB, fulfilled(fetchStats, makeStats({ total_notes: 2 }), "req-b"))
    const afterStale = reducer(
      ok,
      fulfilled(fetchStats, makeStats({ total_notes: 999 }), "req-a"),
    )

    expect(afterStale.stats.data?.total_notes).toBe(2)
  })
})
