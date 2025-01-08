"use client"

import Link from "next/link"
import { useCallback, useEffect } from "react"
import { FilterBar, DATE_RANGE_OPTIONS } from "../components/FilterBar"
import { NotesList } from "../components/NotesList"
import { StatsSummary } from "../components/StatsSummary"
import {
  dateRangeChanged,
  facilityFilterChanged,
  pageChanged,
  pageSizeChanged,
} from "../features/careNotes/careNotesSlice"
import { fetchNotes, fetchStats } from "../features/careNotes/careNotesThunks"
import {
  selectFacilities,
  selectFacilityNames,
  selectFilters,
  selectNotes,
  selectNotesResource,
  selectPagination,
  selectSessionUser,
  selectStatsResource,
} from "../features/careNotes/selectors"
import { useAppDispatch, useAppSelector } from "../hooks/useAppStore"
import { usePolling } from "../hooks/usePolling"
import type { DateRange } from "../types"
import { Card, CardBody, CardHeader } from "../ui/Card"

const POLL_INTERVAL_MS = 60_000

const periodLabel = (range: DateRange): string =>
  DATE_RANGE_OPTIONS.find((option) => option.value === range)?.label ?? "Today"

/** The care notes feed: filters, headline numbers, and the paginated list. */
export const Home = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectSessionUser)
  const facilities = useAppSelector(selectFacilities)
  const facilityNames = useAppSelector(selectFacilityNames)
  const filters = useAppSelector(selectFilters)
  const notes = useAppSelector(selectNotes)
  const notesResource = useAppSelector(selectNotesResource)
  const statsResource = useAppSelector(selectStatsResource)
  const pagination = useAppSelector(selectPagination)

  const { currentPage, pageSize } = pagination
  const { facilityIds, dateRange } = filters

  // Refetch whenever anything that shapes the query changes.
  useEffect(() => {
    dispatch(fetchNotes({ page: currentPage }))
  }, [dispatch, currentPage, pageSize, facilityIds])

  useEffect(() => {
    dispatch(fetchStats())
  }, [dispatch, facilityIds, dateRange])

  const refresh = useCallback(() => {
    dispatch(fetchNotes())
    dispatch(fetchStats())
  }, [dispatch])

  usePolling(refresh, { intervalMs: POLL_INTERVAL_MS })

  const toggleFacility = (facilityId: number) => {
    dispatch(
      facilityFilterChanged(
        facilityIds.includes(facilityId)
          ? facilityIds.filter((id) => id !== facilityId)
          : [...facilityIds, facilityId],
      ),
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Care notes</h1>
        <p className="mt-1 text-sm text-ink-500">
          {user
            ? `Recent notes across ${user.tenantName}.`
            : "Recent notes for your organisation."}
        </p>
      </div>

      <FilterBar
        facilities={facilities}
        selectedFacilityIds={facilityIds}
        dateRange={dateRange}
        pageSize={pageSize}
        onFacilityToggle={toggleFacility}
        onAllFacilities={() => dispatch(facilityFilterChanged([]))}
        onDateRangeChange={(range) => dispatch(dateRangeChanged(range))}
        onPageSizeChange={(size) => dispatch(pageSizeChanged(size))}
      />

      <StatsSummary
        stats={statsResource.data}
        status={statsResource.status}
        error={statsResource.error}
        periodLabel={periodLabel(dateRange)}
        onRetry={() => dispatch(fetchStats())}
      />

      <Card>
        <CardHeader
          title="Recent notes"
          description="Newest first, across every facility you can see unless you narrow the filter."
        />
        <CardBody>
          <NotesList
            notes={notes}
            status={notesResource.status}
            error={notesResource.error}
            pagination={pagination}
            facilityNames={facilityNames}
            onPageChange={(page) => dispatch(pageChanged(page))}
            onRetry={() => dispatch(fetchNotes())}
            emptyAction={
              <Link
                href="/add-note"
                className="inline-flex h-10 items-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
              >
                Record a note
              </Link>
            }
          />
        </CardBody>
      </Card>
    </div>
  )
}
