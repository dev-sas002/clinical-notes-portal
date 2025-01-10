import { describe, expect, it, vi } from "vitest"
import { HttpCareNotesGateway } from "./httpGateway"
import { GatewayError } from "./types"
import {
  errorResponse,
  jsonResponse,
  makePaginatedResponse,
  makeStats,
} from "../../test/factories"

const gatewayWith = (fetchImpl: typeof fetch) =>
  new HttpCareNotesGateway("http://backend:8000/", fetchImpl)

describe("HttpCareNotesGateway", () => {
  it("builds the notes URL from the scoped query", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(makePaginatedResponse()))

    await gatewayWith(fetchImpl as unknown as typeof fetch).listNotes({
      tenantId: 3,
      facilityIds: [11, 12],
      page: 2,
      pageSize: 50,
    })

    const url = new URL(fetchImpl.mock.calls[0][0] as string)
    expect(url.pathname).toBe("/api/care-notes")
    expect(url.searchParams.get("tenant_id")).toBe("3")
    expect(url.searchParams.get("facility_ids")).toBe("11,12")
    expect(url.searchParams.get("page_size")).toBe("50")
  })

  it("omits facility_ids when nothing is filtered", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(makePaginatedResponse()))

    await gatewayWith(fetchImpl as unknown as typeof fetch).listNotes({
      tenantId: 1,
      facilityIds: [],
      page: 1,
      pageSize: 20,
    })

    expect(fetchImpl.mock.calls[0][0]).not.toContain("facility_ids")
  })

  it("asks the backend for the optimised stats query", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(makeStats()))

    await gatewayWith(fetchImpl as unknown as typeof fetch).getStats({
      tenantId: 1,
      facilityIds: [],
      range: "this_week",
    })

    const url = new URL(fetchImpl.mock.calls[0][0] as string)
    expect(url.searchParams.get("range")).toBe("this_week")
    expect(url.searchParams.get("optimized")).toBe("true")
  })

  it("assembles the POST body from the scope, not from the caller", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }))

    await gatewayWith(fetchImpl as unknown as typeof fetch).createNote({
      tenantId: 9,
      facilityIds: [91],
      patient_id: "PT-1",
      category: "medication",
      priority: 1,
      created_by: "A",
      note_content: "b",
    })

    const body = JSON.parse((fetchImpl.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toMatchObject({ tenant_id: 9, facility_id: 91 })
  })

  it("raises a GatewayError carrying the upstream status", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(errorResponse(422, "bad note"))

    await expect(
      gatewayWith(fetchImpl as unknown as typeof fetch).listNotes({
        tenantId: 1,
        facilityIds: [],
        page: 1,
        pageSize: 20,
      }),
    ).rejects.toMatchObject({ name: "GatewayError", status: 422 })
  })

  it("reports an unreachable backend as a 502", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"))

    await expect(
      gatewayWith(fetchImpl as unknown as typeof fetch).getStats({
        tenantId: 1,
        facilityIds: [],
        range: "today",
      }),
    ).rejects.toBeInstanceOf(GatewayError)
  })
})
