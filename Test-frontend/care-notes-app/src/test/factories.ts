import type {
  CareNote,
  CareNotesState,
  CareStats,
  PaginatedNotesResponse,
  Resource,
  SessionUser,
} from "../types"

export const makeNote = (overrides: Partial<CareNote> = {}): CareNote => ({
  id: 1,
  tenant_id: 1,
  facility_id: 11,
  patient_id: "PT-1001",
  category: "observation",
  priority: 3,
  created_at: "2026-01-15T09:00:00.000Z",
  created_by: "A. Rivera (RN)",
  note_content: "Ate a full breakfast and joined the morning activity group.",
  ...overrides,
})

export const makeStats = (overrides: Partial<CareStats> = {}): CareStats => ({
  total_notes: 10,
  by_category: { medication: 5, observation: 3, treatment: 2 },
  by_priority: { 1: 1, 2: 2, 3: 3, 4: 2, 5: 2 },
  by_facility: { 11: 6, 12: 4 },
  avg_notes_per_patient: 2.5,
  date_range: { start: "2026-01-01T00:00:00.000Z", end: "2026-01-31T23:59:59.000Z" },
  ...overrides,
})

export const makePaginatedResponse = (
  overrides: Partial<PaginatedNotesResponse> = {},
): PaginatedNotesResponse => ({
  notes: [makeNote()],
  pagination: { total: 1, page: 1, page_size: 20, total_pages: 1 },
  ...overrides,
})

export const makeSessionUser = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  sub: "u-test",
  name: "A. Rivera (RN)",
  tenantId: 1,
  tenantName: "Northfield Care Group",
  facilities: [
    { id: 11, name: "Northfield House" },
    { id: 12, name: "Elmwood Lodge" },
  ],
  ...overrides,
})

export const makeResource = <T>(
  data: T,
  overrides: Partial<Resource<T>> = {},
): Resource<T> => ({
  data,
  status: "succeeded",
  error: null,
  requestId: null,
  ...overrides,
})

/** Care notes slice state with sensible, already-loaded defaults. */
export const makeCareNotesState = (
  overrides: Partial<CareNotesState> = {},
): Partial<CareNotesState> => ({
  notes: makeResource([makeNote()]),
  stats: makeResource(makeStats()),
  ...overrides,
})

/** A `fetch` stand-in that resolves with the given JSON body. */
export const jsonResponse = (body: unknown, init: Partial<Response> = {}): Response =>
  ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as Response

/** A `fetch` stand-in that resolves with a failing response. */
export const errorResponse = (status: number, body: unknown): Response =>
  ({
    ok: false,
    status,
    statusText: "Error",
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  }) as Response
