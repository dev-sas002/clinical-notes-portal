import type { CareNote, CareStats, PaginatedNotesResponse } from "../../types"
import {
  GatewayError,
  type CareNotesGateway,
  type CreateNoteCommand,
  type ListNotesQuery,
  type StatsQuery,
} from "./types"

/**
 * Talks to the Care Notes FastAPI service.
 *
 * This runs on the server, so the backend URL never reaches the browser and
 * the upstream service can live on a private network.
 */
export class HttpCareNotesGateway implements CareNotesGateway {
  readonly name = "http"

  constructor(
    private readonly rootUrl: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private get baseUrl(): string {
    return `${this.rootUrl.replace(/\/+$/, "")}/api`
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        cache: "no-store",
      })
    } catch (cause) {
      throw new GatewayError(
        `Care Notes backend is unreachable: ${cause instanceof Error ? cause.message : String(cause)}`,
        502,
      )
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new GatewayError(
        body.slice(0, 500) || response.statusText || "Upstream request failed",
        response.status,
      )
    }
    return (await response.json()) as T
  }

  listNotes(query: ListNotesQuery): Promise<PaginatedNotesResponse> {
    const params = new URLSearchParams({
      page: String(query.page),
      page_size: String(query.pageSize),
      tenant_id: String(query.tenantId),
    })
    if (query.facilityIds.length) params.set("facility_ids", query.facilityIds.join(","))
    return this.request<PaginatedNotesResponse>(`/care-notes?${params}`)
  }

  getStats(query: StatsQuery): Promise<CareStats> {
    const params = new URLSearchParams({
      tenant_id: String(query.tenantId),
      range: query.range,
      optimized: "true",
    })
    if (query.facilityIds.length) params.set("facility_ids", query.facilityIds.join(","))
    return this.request<CareStats>(`/care-stats?${params}`)
  }

  createNote(command: CreateNoteCommand): Promise<CareNote> {
    const { tenantId, facilityIds, ...note } = command
    return this.request<CareNote>("/care-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...note,
        tenant_id: tenantId,
        facility_id: facilityIds[0],
      }),
    })
  }
}
