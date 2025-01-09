"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { createNote, type CreateNoteFailure } from "../features/careNotes/careNotesThunks"
import { selectFacilities } from "../features/careNotes/selectors"
import { useAppDispatch, useAppSelector } from "../hooks/useAppStore"
import type { CareNoteCategory, CareNoteDraft, CareNotePriority } from "../types"
import { Button } from "../ui/Button"
import { Card, CardBody, CardHeader } from "../ui/Card"
import { Field } from "../ui/Field"
import { ErrorState } from "../ui/states"
import {
  CARE_NOTE_CATEGORIES,
  CARE_NOTE_PRIORITIES,
  validateNoteDraft,
  type NoteFieldErrors,
} from "../utils/validateNote"
import { getCategoryLabel, getPriorityLabel } from "../utils/priority"

const EMPTY_DRAFT: CareNoteDraft = {
  patient_id: "",
  category: "observation",
  priority: 3,
  created_by: "",
  note_content: "",
}

export interface AddNoteFormProps {
  /** Called after a successful save; defaults to returning to the list. */
  onSuccess?: () => void
}

/**
 * The note form.
 *
 * Validation runs through `validateNoteDraft`, the same function the route
 * handler uses, so the inline messages and the server's rejection can never
 * disagree. The tenant is not a field: the server takes it from the session.
 */
export function AddNoteForm({ onSuccess }: AddNoteFormProps = {}) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const facilities = useAppSelector(selectFacilities)

  const [draft, setDraft] = useState<CareNoteDraft>(EMPTY_DRAFT)
  const [facilityId, setFacilityId] = useState<number | undefined>(undefined)
  const [fieldErrors, setFieldErrors] = useState<NoteFieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const update = <K extends keyof CareNoteDraft>(key: K, value: CareNoteDraft[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }))
    setFieldErrors((previous) => ({ ...previous, [key]: undefined }))
  }

  const chosenFacility = facilityId ?? facilities[0]?.id

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return

    const errors = validateNoteDraft(draft)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setSubmitError(null)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await dispatch(createNote({ draft, facilityId: chosenFacility })).unwrap()
      setDraft(EMPTY_DRAFT)
      if (onSuccess) onSuccess()
      else router.push("/")
    } catch (error) {
      const failure = error as Partial<CreateNoteFailure> | undefined
      if (failure?.fields && Object.keys(failure.fields).length > 0) {
        setFieldErrors(failure.fields)
      }
      setSubmitError(failure?.message ?? "Could not save the note.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader
        title="New care note"
        description="Recorded against the facility you select, inside your own organisation."
      />
      <CardBody>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {submitError ? (
            <ErrorState title="The note was not saved" message={submitError} />
          ) : null}

          <Field label="Patient ID" error={fieldErrors.patient_id} hint="For example PT-1042.">
            {(props) => (
              <input
                {...props}
                type="text"
                autoComplete="off"
                value={draft.patient_id}
                onChange={(event) => update("patient_id", event.target.value)}
              />
            )}
          </Field>

          {facilities.length > 1 ? (
            <Field label="Facility">
              {(props) => (
                <select
                  {...props}
                  value={chosenFacility}
                  onChange={(event) => setFacilityId(Number(event.target.value))}
                >
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" error={fieldErrors.category}>
              {(props) => (
                <select
                  {...props}
                  value={draft.category}
                  onChange={(event) =>
                    update("category", event.target.value as CareNoteCategory)
                  }
                >
                  {CARE_NOTE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field
              label="Priority"
              error={fieldErrors.priority}
              hint="1 is lowest, 5 is highest."
            >
              {(props) => (
                <select
                  {...props}
                  value={draft.priority}
                  onChange={(event) =>
                    update("priority", Number(event.target.value) as CareNotePriority)
                  }
                >
                  {CARE_NOTE_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority} - {getPriorityLabel(priority)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <Field label="Care provider name" error={fieldErrors.created_by}>
            {(props) => (
              <input
                {...props}
                type="text"
                autoComplete="name"
                value={draft.created_by}
                onChange={(event) => update("created_by", event.target.value)}
              />
            )}
          </Field>

          <Field
            label="Care note"
            error={fieldErrors.note_content}
            hint="What happened, what was done, and anything the next shift needs to know."
          >
            {(props) => (
              <textarea
                {...props}
                rows={5}
                value={draft.note_content}
                onChange={(event) => update("note_content", event.target.value)}
              />
            )}
          </Field>

          <div className="flex justify-end gap-3 border-t border-ink-200 pt-5">
            <Button onClick={() => router.push("/")}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save note"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
