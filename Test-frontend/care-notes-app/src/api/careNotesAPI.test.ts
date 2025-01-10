import { afterEach, describe, expect, it, vi } from "vitest"
import { API_BASE_URL, careNotesApi, type ApiError } from "./careNotesAPI"
import {
  errorResponse,
  jsonResponse,
  makePaginatedResponse,
  makeStats,
} from "../test/factories"

const mockFetch = (response: Response) => {
  const spy = vi.fn().mockResolvedValue(response)
  vi.stubGlobal("fetch", spy)
  return spy
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("API base URL", () => {
  it("is same-origin, so no backend address ships in the client bundle", () => {
    expect(API_BASE_URL).toBe("/api")
  })
})

describe("listNotes", () => {
  it("sends page and page size", async () => {
    const spy = mockFetch(jsonResponse(makePaginatedResponse()))

    await careNotesApi.listNotes({ page: 2, pageSize: 50 })

    const url = spy.mock.calls[0][0] as string
    expect(url).toContain("page=2")
    expect(url).toContain("page_size=50")
  })

  it("joins facility ids with a comma", async () => {
    const spy = mockFetch(jsonResponse(makePaginatedResponse()))

    await careNotesApi.listNotes({ facilityIds: [11, 12] })

    expect(decodeURIComponent(spy.mock.calls[0][0] as string)).toContain("facility_ids=11,12")
  })

  it("omits the facility filter when there is none", async () => {
    const spy = mockFetch(jsonResponse(makePaginatedResponse()))

    await careNotesApi.listNotes({ facilityIds: [] })

    expect(spy.mock.calls[0][0]).not.toContain("facility_ids")
  })

  it("sends the session cookie", async () => {
    const spy = mockFetch(jsonResponse(makePaginatedResponse()))

    await careNotesApi.listNotes()

    expect((spy.mock.calls[0][1] as RequestInit).credentials).toBe("same-origin")
  })
})

describe("getStats", () => {
  it("sends the requested range", async () => {
    const spy = mockFetch(jsonResponse(makeStats()))

    await careNotesApi.getStats({ range: "this_year" })

    expect(spy.mock.calls[0][0]).toContain("range=this_year")
  })
})

describe("createNote", () => {
  const draft = {
    patient_id: "PT-1",
    category: "medication" as const,
    priority: 5 as const,
    created_by: "A. Rivera (RN)",
    note_content: "Dose given.",
  }

  it("POSTs JSON", async () => {
    const spy = mockFetch(jsonResponse({ id: 1 }))

    await careNotesApi.createNote(draft)

    const init = spy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe("POST")
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json")
  })

  it("includes a chosen facility, and nothing else", async () => {
    const spy = mockFetch(jsonResponse({ id: 1 }))

    await careNotesApi.createNote(draft, 12)

    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.facility_id).toBe(12)
    expect(body).not.toHaveProperty("tenant_id")
  })
})

describe("error handling", () => {
  it("raises ApiError carrying the status and the server's message", async () => {
    mockFetch(errorResponse(404, { error: "Nothing here" }))

    await expect(careNotesApi.listNotes()).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "Nothing here",
    })
  })

  it("carries field errors through for the form to render", async () => {
    mockFetch(errorResponse(422, { error: "Rejected", fields: { note_content: "required" } }))

    await expect(
      careNotesApi.createNote({
        patient_id: "",
        category: "observation",
        priority: 1,
        created_by: "",
        note_content: "",
      }),
    ).rejects.toMatchObject({ fields: { note_content: "required" } })
  })

  it("flags a 401 so the UI can send the user back to sign-in", async () => {
    mockFetch(errorResponse(401, { error: "Not signed in." }))

    await careNotesApi.listNotes().catch((error: ApiError) => {
      expect(error.isUnauthenticated).toBe(true)
    })
  })

  it("falls back to a generic message when the body has none", async () => {
    mockFetch(errorResponse(500, {}))

    await expect(careNotesApi.listNotes()).rejects.toThrow(/Request failed \(500\)/)
  })

  it("reports an unreachable server rather than throwing a raw TypeError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))

    await expect(careNotesApi.listNotes()).rejects.toMatchObject({ status: 0 })
  })
})

describe("session calls", () => {
  it("signs in with the credentials", async () => {
    const spy = mockFetch(jsonResponse({ user: null }))

    await careNotesApi.signIn("a@b.example", "pw")

    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toEqual({ email: "a@b.example", password: "pw" })
  })

  it("signs out with DELETE", async () => {
    const spy = mockFetch(jsonResponse({ user: null }))

    await careNotesApi.signOut()

    expect((spy.mock.calls[0][1] as RequestInit).method).toBe("DELETE")
  })
})
