"use client"

import type React from "react"
import type { DateRange, Facility } from "../types"
import { SelectControl } from "../ui/Field"
import { cn } from "../ui/cn"

export const DATE_RANGE_OPTIONS: Array<{ value: DateRange; label: string }> = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "this_year", label: "This year" },
  { value: "all_time", label: "All time" },
]

export const PAGE_SIZE_OPTIONS = [20, 50, 100]

export interface FilterBarProps {
  /** Facilities this session is allowed to see. */
  facilities: Facility[]
  selectedFacilityIds: number[]
  dateRange: DateRange
  pageSize: number
  onFacilityToggle: (facilityId: number) => void
  onAllFacilities: () => void
  onDateRangeChange: (range: DateRange) => void
  onPageSizeChange: (pageSize: number) => void
}

/**
 * Facility, period and page-size controls.
 *
 * There is deliberately no tenant picker. The tenant comes from the signed-in
 * session, and the facilities offered here are only the ones that session
 * grants - the server intersects the filter with the same list, so this is a
 * convenience, not the control.
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  facilities,
  selectedFacilityIds,
  dateRange,
  pageSize,
  onFacilityToggle,
  onAllFacilities,
  onDateRangeChange,
  onPageSizeChange,
}) => {
  const showingAll = selectedFacilityIds.length === 0

  return (
    <div className="rounded-card border border-ink-200 bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <fieldset className="min-w-0">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Facilities
          </legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={showingAll}
              onClick={onAllFacilities}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                showingAll
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-ink-300 bg-white text-ink-600 hover:bg-ink-100",
              )}
            >
              All facilities
            </button>
            {facilities.map((facility) => {
              const selected = selectedFacilityIds.includes(facility.id)
              return (
                <button
                  key={facility.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onFacilityToggle(facility.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    selected
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-ink-300 bg-white text-ink-600 hover:bg-ink-100",
                  )}
                >
                  {facility.name}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end">
          <div>
            <label
              htmlFor="stats-period"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500"
            >
              Statistics period
            </label>
            <SelectControl
              id="stats-period"
              value={dateRange}
              onChange={(event) => onDateRangeChange(event.target.value as DateRange)}
              className="sm:w-44"
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectControl>
          </div>

          <div>
            <label
              htmlFor="page-size"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500"
            >
              Notes per page
            </label>
            <SelectControl
              id="page-size"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="sm:w-32"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </SelectControl>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-500">
        The period applies to the statistics panels. The notes list always shows the most recent
        notes for the selected facilities.
      </p>
    </div>
  )
}
