import type { CareNoteCategory, CareNoteDraft, CareNotePriority } from "../types"

/**
 * One validation rule set, used by the form *and* by the route handler.
 *
 * The form runs it to show inline messages; the server runs it again because
 * a client-side check is a convenience, never a control. Keeping both on the
 * same function means the two can never drift.
 */

export const CARE_NOTE_CATEGORIES: CareNoteCategory[] = [
  "medication",
  "observation",
  "treatment",
]

export const CARE_NOTE_PRIORITIES: CareNotePriority[] = [1, 2, 3, 4, 5]

export const NOTE_CONTENT_MAX = 2000
export const PATIENT_ID_MAX = 64

export type NoteFieldErrors = Partial<Record<keyof CareNoteDraft, string>>

export const validateNoteDraft = (draft: Partial<CareNoteDraft>): NoteFieldErrors => {
  const errors: NoteFieldErrors = {}

  const patientId = (draft.patient_id ?? "").trim()
  if (!patientId) errors.patient_id = "Patient ID is required."
  else if (patientId.length > PATIENT_ID_MAX)
    errors.patient_id = `Patient ID must be ${PATIENT_ID_MAX} characters or fewer.`

  const createdBy = (draft.created_by ?? "").trim()
  if (!createdBy) errors.created_by = "Care provider name is required."

  const content = (draft.note_content ?? "").trim()
  if (!content) errors.note_content = "The note cannot be empty."
  else if (content.length > NOTE_CONTENT_MAX)
    errors.note_content = `Keep the note under ${NOTE_CONTENT_MAX} characters.`

  if (!CARE_NOTE_CATEGORIES.includes(draft.category as CareNoteCategory))
    errors.category = "Choose a category."

  if (!CARE_NOTE_PRIORITIES.includes(draft.priority as CareNotePriority))
    errors.priority = "Choose a priority between 1 and 5."

  return errors
}

/** Normalised draft, or the field errors that stopped it. */
export const parseNoteDraft = (
  draft: Partial<CareNoteDraft>,
): { ok: true; value: CareNoteDraft } | { ok: false; errors: NoteFieldErrors } => {
  const errors = validateNoteDraft(draft)
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    value: {
      patient_id: (draft.patient_id as string).trim(),
      created_by: (draft.created_by as string).trim(),
      note_content: (draft.note_content as string).trim(),
      category: draft.category as CareNoteCategory,
      priority: draft.priority as CareNotePriority,
    },
  }
}
