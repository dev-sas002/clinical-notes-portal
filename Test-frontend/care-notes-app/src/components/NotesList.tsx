"use client"

import type React from "react"
import type { CareNote, Pagination, RequestStatus } from "../types"
import { useVirtualRange } from "../hooks/useVirtualRange"
import { Button } from "../ui/Button"
import { EmptyState, ErrorState, LoadingState } from "../ui/states"
import { CareNoteCard, NOTE_ROW_HEIGHT } from "./CareNoteCard"

/** Above this many rows the list switches to a windowed scroller. */
export const VIRTUALISE_ABOVE = 40

/** Height of that scroller. Chosen to show roughly four rows plus a hint of the fifth. */
const VIEWPORT_HEIGHT = 620

export interface NotesListProps {
  notes: CareNote[]
  status: RequestStatus
  error: string | null
  pagination: Pagination
  facilityNames: Record<number, string>
  onPageChange: (page: number) => void
  onRetry: () => void
  /** Rendered inside the empty state, e.g. a link to the add-note form. */
  emptyAction?: React.ReactNode
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  status,
  error,
  pagination,
  facilityNames,
  onPageChange,
  onRetry,
  emptyAction,
}) => {
  const virtualised = notes.length > VIRTUALISE_ABOVE
  const { containerRef, onScroll, range } = useVirtualRange({
    itemCount: notes.length,
    itemHeight: NOTE_ROW_HEIGHT,
    viewportHeight: VIEWPORT_HEIGHT,
  })

  // Only the first load shows skeletons; a background poll must not blank a
  // list the user is reading.
  if (status === "loading" && notes.length === 0) {
    return <LoadingState label="Loading care notes" rows={4} />
  }

  if (status === "failed" && notes.length === 0) {
    return <ErrorState message={error ?? "Care notes could not be loaded."} onRetry={onRetry} />
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        title="No care notes here yet"
        message="Nothing matches the current facility filter. Record a note, or widen the filter to see more."
        action={emptyAction}
      />
    )
  }

  const currentPage = Math.max(1, pagination.currentPage)
  const totalPages = Math.max(1, pagination.totalPages)
  const firstOnPage = (currentPage - 1) * pagination.pageSize + 1
  const lastOnPage = firstOnPage + notes.length - 1

  const visible = virtualised ? notes.slice(range.startIndex, range.endIndex) : notes

  const rows = visible.map((note) => (
    <CareNoteCard key={note.id} note={note} facilityName={facilityNames[note.facility_id]} />
  ))

  return (
    <div>
      {status === "failed" && error ? (
        <div className="mb-4">
          <ErrorState
            title="Showing the last results loaded"
            message={error}
            onRetry={onRetry}
          />
        </div>
      ) : null}

      {virtualised ? (
        <div
          ref={containerRef}
          onScroll={onScroll}
          style={{ height: VIEWPORT_HEIGHT }}
          className="overflow-y-auto rounded-lg"
          data-testid="notes-scroller"
        >
          <div style={{ height: range.totalHeight, position: "relative" }}>
            <div
              style={{ transform: `translateY(${range.offsetTop}px)` }}
              className="absolute inset-x-0 top-0 space-y-3"
            >
              {rows}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">{rows}</div>
      )}

      <nav
        className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-4"
        aria-label="Care notes pages"
      >
        <p className="text-sm tabular-nums text-ink-500">
          Showing <strong className="text-ink-700">{firstOnPage}</strong>&ndash;
          <strong className="text-ink-700">{lastOnPage}</strong> of{" "}
          <strong className="text-ink-700">{pagination.totalItems}</strong>
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="px-1 text-sm tabular-nums text-ink-500">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </nav>
    </div>
  )
}
