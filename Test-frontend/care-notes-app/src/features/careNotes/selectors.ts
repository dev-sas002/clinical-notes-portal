import { createSelector } from "@reduxjs/toolkit"
import type { CareNote, Facility, RootState } from "../../types"

/**
 * Memoised reads of the store.
 *
 * Components select through these rather than destructuring the slice, so a
 * poll that only changes `stats` does not re-render the note list, and
 * derived arrays keep a stable identity between renders (which is what lets
 * `React.memo` on the note cards actually pay off).
 */

export const selectNotesResource = (state: RootState) => state.careNotes.notes
export const selectStatsResource = (state: RootState) => state.careNotes.stats
export const selectFilters = (state: RootState) => state.careNotes.filters
export const selectPagination = (state: RootState) => state.careNotes.pagination
export const selectLastSync = (state: RootState) => state.careNotes.lastSync
export const selectSessionUser = (state: RootState) => state.session.user

export const selectNotes = createSelector(
  selectNotesResource,
  (resource): CareNote[] => resource.data,
)

export const selectStats = createSelector(selectStatsResource, (resource) => resource.data)

/** Facilities this session may see, sorted for a stable dropdown order. */
export const selectFacilities = createSelector(selectSessionUser, (user): Facility[] =>
  [...(user?.facilities ?? [])].sort((a, b) => a.id - b.id),
)

export const selectFacilityNames = createSelector(
  selectFacilities,
  (facilities): Record<number, string> =>
    Object.fromEntries(facilities.map((facility) => [facility.id, facility.name])),
)

/** True while either resource is in flight - used only for subtle chrome. */
export const selectIsSyncing = createSelector(
  selectNotesResource,
  selectStatsResource,
  (notes, stats) => notes.status === "loading" || stats.status === "loading",
)

/** The 1-based index range the current page covers, for "x-y of z". */
export const selectPageWindow = createSelector(
  selectPagination,
  selectNotes,
  (pagination, notes) => {
    const first =
      notes.length === 0 ? 0 : (pagination.currentPage - 1) * pagination.pageSize + 1
    return { first, last: first === 0 ? 0 : first + notes.length - 1 }
  },
)
