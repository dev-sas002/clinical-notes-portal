import type React from "react"
import type { CareStats, RequestStatus } from "../types"
import { StatTile } from "../ui/StatTile"
import { ErrorState, LoadingState } from "../ui/states"

export interface StatsSummaryProps {
  stats: CareStats | null
  status: RequestStatus
  error: string | null
  /** Human label for the selected period, e.g. "Today". */
  periodLabel: string
  onRetry: () => void
}

/** The four headline numbers, shared by the home screen and the dashboard. */
export const StatsSummary: React.FC<StatsSummaryProps> = ({
  stats,
  status,
  error,
  periodLabel,
  onRetry,
}) => {
  if (status === "loading" && !stats)
    return <LoadingState label="Loading statistics" rows={2} />

  if (status === "failed" && !stats) {
    return <ErrorState message={error ?? "Statistics could not be loaded."} onRetry={onRetry} />
  }

  const tiles = [
    { label: "Total notes", value: stats?.total_notes ?? 0, caption: periodLabel },
    {
      label: "Avg notes / patient",
      value: (stats?.avg_notes_per_patient ?? 0).toFixed(1),
      caption: "Across patients with a note",
    },
    {
      label: "Active facilities",
      value: Object.keys(stats?.by_facility ?? {}).length,
      caption: "Reporting in this period",
    },
    {
      label: "Categories used",
      value: Object.keys(stats?.by_category ?? {}).length,
      caption: "Of three available",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <StatTile key={tile.label} {...tile} />
      ))}
    </div>
  )
}
