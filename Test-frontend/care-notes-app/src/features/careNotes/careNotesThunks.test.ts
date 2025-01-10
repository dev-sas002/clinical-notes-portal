import { afterEach, describe, expect, it, vi } from "vitest"
import { createNote, fetchNotes, fetchStats } from "./careNotesThunks"
import { makeTestStore } from "../../test/renderWithStore"
import {
  errorResponse,
  jsonResponse,
  makePaginatedResponse,
  makeStats,
} from "../../test/factories"
import { facilityFilterChanged, pageSizeChanged } from "./careNotesSlice"

const mockFetch = (response: Response) => {
  const spy = vi.fn().mockResolvedValue(response)
  vi.stubGlobal("fetch", spy)
  return spy
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("fetchNotes", () => {
  it("calls this app's own API, never the backend directly", async () => {
    const spy = mockFetch(jsonResponse(makePaginatedResponse()))
    const store = makeTestStore()

    await store.dispatch(fetchNotes())

    expect(spy.mock.calls[0][0]).toMatch(/^\/api\/care-notes\?/)
  })

  it("never sends a tenant id", async () => {
    const spy = mockFetch(jsonResponse(makePaginatedResponse()))
    const store = makeTestStore()

    await store.dispatch(fetchNotes())

    expect(spy.mock.calls[0][0]).not.toContain("tenant_id")
  })

  it("sends the current filters and page size", async () => {
    const spy = mockFetch(jsonResponse(makePaginatedResponse()))
    const store = makeTestStore()
    store.dispatch(facilityFilterChanged([11, 12]))
    store.dispatch(pageSizeChanged(50))

    await store.dispatch(fetchNotes({ page: 3 }))

    const url = spy.mock.calls[0][0] as string
    expect(url).toContain("facility_ids=11%2C12")
    expect(url).toContain("page_size=50")
    expect(url).toContain("page=3")
  })

  it("stores the returned page", async () => {
    mockFetch(jsonResponse(makePaginatedResponse()))
    const store = makeTestStore()

    await store.dispatch(fetchNotes())

    expect(store.getState().careNotes.notes.data).toHaveLength(1)
  })

  it("rejects with the server's message", async () => {
    mockFetch(errorResponse(500, { error: "Care Notes backend is unreachable" }))
    const store = makeTestStore()

    await store.dispatch(fetchNotes())

    expect(store.getState().careNotes.notes.error).toMatch(/unreachable/)
  })

  it("reports a thrown network error instead of hanging", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    const store = makeTestStore()

    await store.dispatch(fetchNotes())

    expect(store.getState().careNotes.notes.status).toBe("failed")
  })
})

describe("fetchStats", () => {
  it("sends the selected range", async () => {
    const spy = mockFetch(jsonResponse(makeStats()))
    const store = makeTestStore()

    await store.dispatch(fetchStats())

    expect(spy.mock.calls[0][0]).toContain("range=today")
  })

  it("stores the aggregate", async () => {
    mockFetch(jsonResponse(makeStats({ total_notes: 5 })))
    const store = makeTestStore()

    await store.dispatch(fetchStats())

    expect(store.getState().careNotes.stats.data?.total_notes).toBe(5)
  })

  it("records a failure without touching the notes resource", async () => {
    mockFetch(errorResponse(502, { error: "backend down" }))
    const store = makeTestStore()

    await store.dispatch(fetchStats())

    expect(store.getState().careNotes.stats.status).toBe("failed")
    expect(store.getState().careNotes.notes.status).toBe("idle")
  })
})

describe("createNote", () => {
  const draft = {
    patient_id: "PT-1",
    category: "observation" as const,
    priority: 3 as const,
    created_by: "A. Rivera (RN)",
    note_content: "Settled.",
  }

  it("posts the draft without a tenant id", async () => {
    const spy = mockFetch(jsonResponse({ id: 1 }))
    const store = makeTestStore()

    await store.dispatch(createNote({ draft, facilityId: 11 }))

    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toMatchObject({ facility_id: 11 })
    expect(body).not.toHaveProperty("tenant_id")
  })

  it("rejects with field errors so the form can attach them to inputs", async () => {
    mockFetch(
      errorResponse(422, {
        error: "The note was rejected.",
        fields: { patient_id: "required" },
      }),
    )
    const store = makeTestStore()

    await expect(
      store.dispatch(createNote({ draft, facilityId: 11 })).unwrap(),
    ).rejects.toMatchObject({ fields: { patient_id: "required" } })
  })
})
