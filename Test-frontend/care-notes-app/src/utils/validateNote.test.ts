import { describe, expect, it } from "vitest"
import { NOTE_CONTENT_MAX, parseNoteDraft, validateNoteDraft } from "./validateNote"
import type { CareNoteDraft } from "../types"

const draft = (overrides: Partial<CareNoteDraft> = {}): Partial<CareNoteDraft> => ({
  patient_id: "PT-1042",
  category: "observation",
  priority: 3,
  created_by: "A. Rivera (RN)",
  note_content: "Settled and comfortable at handover.",
  ...overrides,
})

describe("validateNoteDraft", () => {
  it("accepts a complete draft", () => {
    expect(validateNoteDraft(draft())).toEqual({})
  })

  it.each([
    ["patient_id", { patient_id: "   " }],
    ["created_by", { created_by: "" }],
    ["note_content", { note_content: "\n\t " }],
  ])("requires %s", (field, overrides) => {
    expect(validateNoteDraft(draft(overrides))).toHaveProperty(field)
  })

  it("rejects a category the backend does not accept", () => {
    expect(validateNoteDraft(draft({ category: "nutrition" as never }))).toHaveProperty(
      "category",
    )
  })

  it("rejects a priority outside 1-5", () => {
    expect(validateNoteDraft(draft({ priority: 9 as never }))).toHaveProperty("priority")
  })

  it("rejects a note longer than the column allows", () => {
    expect(
      validateNoteDraft(draft({ note_content: "x".repeat(NOTE_CONTENT_MAX + 1) })),
    ).toHaveProperty("note_content")
  })
})

describe("parseNoteDraft", () => {
  it("trims the free-text fields", () => {
    const result = parseNoteDraft(draft({ patient_id: "  PT-7  ", created_by: " Nurse  " }))

    expect(result).toMatchObject({ ok: true })
    if (result.ok) {
      expect(result.value.patient_id).toBe("PT-7")
      expect(result.value.created_by).toBe("Nurse")
    }
  })

  it("returns the field errors instead of a value when invalid", () => {
    const result = parseNoteDraft(draft({ patient_id: "" }))

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.patient_id).toBeTruthy()
  })

  it("drops anything that is not part of the draft contract", () => {
    const result = parseNoteDraft({
      ...draft(),
      tenant_id: 99,
    } as Partial<CareNoteDraft>)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).not.toHaveProperty("tenant_id")
  })
})
