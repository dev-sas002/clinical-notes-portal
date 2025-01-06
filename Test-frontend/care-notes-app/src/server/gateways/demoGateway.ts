import type { CareNote, CareStats, DateRange, PaginatedNotesResponse } from "../../types"
import { generateDemoNotes, type GenerateOptions } from "./demoData"
import type { CareNotesGateway, CreateNoteCommand, ListNotesQuery, StatsQuery } from "./types"

/** Inclusive start / exclusive end of a named window, in epoch milliseconds. */
export const resolveRange = (range: DateRange, now: number): { start: number; end: number } => {
  const end = now
  const reference = new Date(now)
  const startOfDay = new Date(reference)
  startOfDay.setHours(0, 0, 0, 0)

  switch (range) {
    case "today":
      return { start: startOfDay.getTime(), end }
    case "this_week": {
      const start = new Date(startOfDay)
      // ISO weeks start on Monday; getDay() returns 0 for Sunday.
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
      return { start: start.getTime(), end }
    }
    case "this_month": {
      const start = new Date(reference.getFullYear(), reference.getMonth(), 1)
      return { start: start.getTime(), end }
    }
    case "this_year": {
      const start = new Date(reference.getFullYear(), 0, 1)
      return { start: start.getTime(), end }
    }
    case "all_time":
    default:
      return { start: 0, end }
  }
}

/**
 * Serves the seeded corpus from memory.
 *
 * It exists so the application is demonstrable, screenshot-able and
 * Docker-runnable with no backend at all, and so the route handlers have a
 * gateway to test against that makes no network calls.
 */
export class DemoCareNotesGateway implements CareNotesGateway {
  readonly name = "demo"

  private notes: CareNote[]
  private nextId: number

  constructor(options: GenerateOptions = {}) {
    this.notes = generateDemoNotes(options)
    this.nextId = Math.max(...this.notes.map((note) => note.id)) + 1
  }

  private scoped(tenantId: number, facilityIds: number[]): CareNote[] {
    const facilities = new Set(facilityIds)
    return this.notes.filter(
      (note) =>
        note.tenant_id === tenantId &&
        (facilities.size === 0 || facilities.has(note.facility_id)),
    )
  }

  async listNotes(query: ListNotesQuery): Promise<PaginatedNotesResponse> {
    const matching = this.scoped(query.tenantId, query.facilityIds)
    const pageSize = Math.max(1, query.pageSize)
    const totalPages = Math.max(1, Math.ceil(matching.length / pageSize))
    const page = Math.min(Math.max(1, query.page), totalPages)
    const offset = (page - 1) * pageSize

    return {
      notes: matching.slice(offset, offset + pageSize),
      pagination: {
        total: matching.length,
        page,
        page_size: pageSize,
        total_pages: totalPages,
      },
    }
  }

  async getStats(query: StatsQuery, now: number = Date.now()): Promise<CareStats> {
    const { start, end } = resolveRange(query.range, now)
    const matching = this.scoped(query.tenantId, query.facilityIds).filter((note) => {
      const at = new Date(note.created_at).getTime()
      return at >= start && at <= end
    })

    const byCategory: Record<string, number> = {}
    const byPriority: Record<number, number> = {}
    const byFacility: Record<number, number> = {}
    const patients = new Set<string>()

    for (const note of matching) {
      byCategory[note.category] = (byCategory[note.category] ?? 0) + 1
      byPriority[note.priority] = (byPriority[note.priority] ?? 0) + 1
      byFacility[note.facility_id] = (byFacility[note.facility_id] ?? 0) + 1
      patients.add(note.patient_id)
    }

    return {
      total_notes: matching.length,
      by_category: byCategory,
      by_priority: byPriority,
      by_facility: byFacility,
      avg_notes_per_patient: patients.size ? matching.length / patients.size : 0,
      date_range: {
        start: new Date(start || end).toISOString(),
        end: new Date(end).toISOString(),
      },
    }
  }

  async createNote(command: CreateNoteCommand): Promise<CareNote> {
    const { tenantId, facilityIds, ...input } = command
    const note: CareNote = {
      ...input,
      id: (this.nextId += 1),
      tenant_id: tenantId,
      facility_id: facilityIds[0],
      created_at: new Date().toISOString(),
    }
    this.notes.unshift(note)
    return note
  }
}
