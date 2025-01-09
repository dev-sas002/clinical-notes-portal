import React from "react"
import type { CareNote } from "../types"
import { formatDate, formatDateTime } from "../utils/formatDate"
import {
  getCategoryLabel,
  getCategoryTone,
  getPriorityAccentClass,
  getPriorityBadgeClass,
  getPriorityLabel,
} from "../utils/priority"
import { Badge } from "../ui/Badge"
import { cn } from "../ui/cn"

export interface CareNoteCardProps {
  note: CareNote
  /** Resolved facility name; falls back to the id when unknown. */
  facilityName?: string
}

/**
 * One note, at a fixed height.
 *
 * The height is fixed on purpose: it is what lets the list window itself
 * without measuring every row (see `useVirtualRange`), and a uniform row
 * makes a long feed far easier to scan. Note bodies in this system are one
 * or two sentences, so the clamp is a guard rather than something users hit.
 */
const CareNoteCardComponent: React.FC<CareNoteCardProps> = ({ note, facilityName }) => (
  <article
    className={cn(
      "flex h-32 flex-col justify-between overflow-hidden rounded-card border border-ink-200",
      "border-l-4 bg-white px-4 py-3 shadow-card transition-shadow hover:shadow-raised",
      getPriorityAccentClass(note.priority),
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-ink-900">
          Patient {note.patient_id}
        </h3>
        <p className="truncate text-xs text-ink-500">
          {facilityName ?? `Facility ${note.facility_id}`} &middot; {note.created_by}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Badge tone={getCategoryTone(note.category)}>{getCategoryLabel(note.category)}</Badge>
        <Badge tone={getPriorityBadgeClass(note.priority)}>
          P{note.priority} {getPriorityLabel(note.priority)}
        </Badge>
      </div>
    </div>

    <p className="line-clamp-2 text-sm leading-relaxed text-ink-700">{note.note_content}</p>

    <time
      dateTime={note.created_at}
      title={formatDateTime(note.created_at)}
      className="text-xs text-ink-400"
    >
      {formatDate(note.created_at)}
    </time>
  </article>
)

/**
 * Memoised: a stats poll changes the store every minute, and without this
 * every card in the list re-renders for a number it does not display.
 */
export const CareNoteCard = React.memo(CareNoteCardComponent)
CareNoteCard.displayName = "CareNoteCard"

/** Row height in pixels, including the gap beneath the card. */
export const NOTE_ROW_HEIGHT = 140
