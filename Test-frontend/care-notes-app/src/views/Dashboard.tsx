"use client"

import { useCallback, useEffect } from "react"
import { CategoryChart } from "../components/CategoryChart"
import { DATE_RANGE_OPTIONS } from "../components/FilterBar"
import { FacilityBreakdown } from "../components/FacilityBreakdown"
import { PriorityDistribution } from "../components/PriorityDistribution"
import { StatsSummary } from "../components/StatsSummary"
import { dateRangeChanged } from "../features/careNotes/careNotesSlice"
import { fetchStats } from "../features/careNotes/careNotesThunks"
import {
  selectFacilityNames,
  selectFilters,
  selectLastSync,
  selectSessionUser,
  selectStatsResource,
} from "../features/careNotes/selectors"
import { useAppDispatch, useAppSelector } from "../hooks/useAppStore"
import { usePolling } from "../hooks/usePolling"
import type { DateRange } from "../types"
import { SelectControl } from "../ui/Field"
import { InlineSpinner } from "../ui/states"
import { formatDateTime } from "../utils/formatDate"

const POLL_INTERVAL_MS = 60_000

/** Aggregate view: the same numbers as the home panel, broken down three ways. */
export const Dashboard = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectSessionUser)
  const facilityNames = useAppSelector(selectFacilityNames)
  const { facilityIds, dateRange } = useAppSelector(selectFilters)
  const stats = useAppSelector(selectStatsResource)
  const lastSync = useAppSelector(selectLastSync)

  useEffect(() => {
    dispatch(fetchStats())
  }, [dispatch, facilityIds, dateRange])

  const refresh = useCallback(() => {
    dispatch(fetchStats())
  }, [dispatch])

  usePolling(refresh, { intervalMs: POLL_INTERVAL_MS })

  const periodLabel =
    DATE_RANGE_OPTIONS.find((option) => option.value === dateRange)?.label ?? "Today"

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">
            {user ? `${user.tenantName} · ` : ""}
            {periodLabel.toLowerCase()}
            {lastSync ? ` · updated ${formatDateTime(lastSync)}` : ""}
          </p>
        </div>

        <div className="flex items-end gap-3">
          {stats.status === "loading" && stats.data ? (
            <InlineSpinner label="Refreshing" />
          ) : null}
          <div>
            <label
              htmlFor="dashboard-period"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500"
            >
              Period
            </label>
            <SelectControl
              id="dashboard-period"
              value={dateRange}
              onChange={(event) => dispatch(dateRangeChanged(event.target.value as DateRange))}
              className="w-44"
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectControl>
          </div>
        </div>
      </div>

      <StatsSummary
        stats={stats.data}
        status={stats.status}
        error={stats.error}
        periodLabel={periodLabel}
        onRetry={refresh}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <CategoryChart data={stats.data?.by_category ?? {}} />
        <PriorityDistribution data={stats.data?.by_priority ?? {}} />
      </div>

      <FacilityBreakdown data={stats.data?.by_facility ?? {}} facilityNames={facilityNames} />
    </div>
  )
}
