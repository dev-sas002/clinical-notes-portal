import type {
  CareNote,
  CareNoteInput,
  CareStats,
  DateRange,
  PaginatedNotesResponse,
} from "../../types"

/**
 * Every query a gateway receives is already tenant-scoped by the route
 * handler from the signed session. A gateway implementation must never have
 * to trust, or even see, anything the browser sent.
 */
export interface TenantScope {
  tenantId: number
  /** Facilities to filter by. Empty means "every facility in the scope". */
  facilityIds: number[]
}

export interface ListNotesQuery extends TenantScope {
  page: number
  pageSize: number
}

export interface StatsQuery extends TenantScope {
  range: DateRange
}

export type CreateNoteCommand = TenantScope & Omit<CareNoteInput, "tenant_id" | "facility_id">

/**
 * The single seam between this app and wherever care notes actually live.
 *
 * Adding a new backing store (a GraphQL service, a read replica, a fixture
 * server for integration tests) means writing one class against this
 * interface and registering it in `./index.ts`. No route handler, slice or
 * component changes.
 */
export interface CareNotesGateway {
  /** Identifier reported by `/healthz`, so it is obvious which one is live. */
  readonly name: string
  listNotes(query: ListNotesQuery): Promise<PaginatedNotesResponse>
  getStats(query: StatsQuery): Promise<CareStats>
  createNote(command: CreateNoteCommand): Promise<CareNote>
}

/** Raised by a gateway when the upstream store answers with an error. */
export class GatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "GatewayError"
  }
}
