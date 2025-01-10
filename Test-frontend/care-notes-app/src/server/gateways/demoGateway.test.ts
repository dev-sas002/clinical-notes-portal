import { describe, expect, it } from "vitest"
import { DemoCareNotesGateway, resolveRange } from "./demoGateway"
import { generateDemoNotes } from "./demoData"

const NOW = new Date("2026-06-15T12:00:00.000Z").getTime()
const gateway = () => new DemoCareNotesGateway({ now: NOW })

describe("generateDemoNotes", () => {
  it("is deterministic for a given seed and reference time", () => {
    expect(generateDemoNotes({ seed: 7, now: NOW })).toEqual(
      generateDemoNotes({ seed: 7, now: NOW }),
    )
  })

  it("returns notes newest first", () => {
    const notes = generateDemoNotes({ now: NOW })
    const timestamps = notes.map((note) => new Date(note.created_at).getTime())

    expect([...timestamps].sort((a, b) => b - a)).toEqual(timestamps)
  })

  it("only uses synthetic patient identifiers", () => {
    expect(
      generateDemoNotes({ now: NOW }).every((note) => /^PT-\d+$/.test(note.patient_id)),
    ).toBe(true)
  })
})

describe("resolveRange", () => {
  it("starts today at midnight", () => {
    const { start } = resolveRange("today", NOW)

    expect(new Date(start).getHours()).toBe(0)
  })

  it("starts this_week on a Monday", () => {
    const { start } = resolveRange("this_week", NOW)

    expect(new Date(start).getDay()).toBe(1)
  })

  it("starts this_month on the first", () => {
    expect(new Date(resolveRange("this_month", NOW).start).getDate()).toBe(1)
  })

  it("starts all_time at the epoch", () => {
    expect(resolveRange("all_time", NOW).start).toBe(0)
  })
})

describe("DemoCareNotesGateway", () => {
  it("never returns a note belonging to another tenant", async () => {
    const page = await gateway().listNotes({
      tenantId: 1,
      facilityIds: [],
      page: 1,
      pageSize: 100,
    })

    expect(page.notes.every((note) => note.tenant_id === 1)).toBe(true)
  })

  it("filters to the requested facilities", async () => {
    const page = await gateway().listNotes({
      tenantId: 1,
      facilityIds: [12],
      page: 1,
      pageSize: 100,
    })

    expect(page.notes.every((note) => note.facility_id === 12)).toBe(true)
  })

  it("paginates with a consistent total", async () => {
    const instance = gateway()
    const first = await instance.listNotes({
      tenantId: 1,
      facilityIds: [],
      page: 1,
      pageSize: 20,
    })
    const second = await instance.listNotes({
      tenantId: 1,
      facilityIds: [],
      page: 2,
      pageSize: 20,
    })

    expect(first.notes).toHaveLength(20)
    expect(first.pagination.total).toBe(second.pagination.total)
    expect(first.notes[0].id).not.toBe(second.notes[0].id)
  })

  it("clamps a page beyond the end back to the last page", async () => {
    const page = await gateway().listNotes({
      tenantId: 1,
      facilityIds: [],
      page: 9999,
      pageSize: 20,
    })

    expect(page.pagination.page).toBe(page.pagination.total_pages)
  })

  it("aggregates statistics over the requested window only", async () => {
    const instance = gateway()
    const today = await instance.getStats({ tenantId: 1, facilityIds: [], range: "today" }, NOW)
    const allTime = await instance.getStats(
      { tenantId: 1, facilityIds: [], range: "all_time" },
      NOW,
    )

    expect(today.total_notes).toBeGreaterThan(0)
    expect(allTime.total_notes).toBeGreaterThan(today.total_notes)
  })

  it("reports an average of notes per distinct patient", async () => {
    const stats = await gateway().getStats(
      { tenantId: 1, facilityIds: [], range: "all_time" },
      NOW,
    )

    expect(stats.avg_notes_per_patient).toBeGreaterThanOrEqual(1)
  })

  it("stamps a created note with the scoped tenant and facility", async () => {
    const note = await gateway().createNote({
      tenantId: 2,
      facilityIds: [21],
      patient_id: "PT-9001",
      category: "treatment",
      priority: 4,
      created_by: "S. Patel (RN)",
      note_content: "Dressing changed.",
    })

    expect(note).toMatchObject({ tenant_id: 2, facility_id: 21, patient_id: "PT-9001" })
  })

  it("puts a created note at the top of its tenant's list", async () => {
    const instance = gateway()
    const created = await instance.createNote({
      tenantId: 1,
      facilityIds: [11],
      patient_id: "PT-9002",
      category: "observation",
      priority: 2,
      created_by: "T. Nakamura (HCA)",
      note_content: "Settled overnight.",
    })

    const page = await instance.listNotes({
      tenantId: 1,
      facilityIds: [],
      page: 1,
      pageSize: 5,
    })

    expect(page.notes[0].id).toBe(created.id)
  })
})
