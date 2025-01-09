import type React from "react"
import { Card, CardBody, CardHeader } from "../ui/Card"
import { EmptyState } from "../ui/states"
import { toPercentage } from "../utils/priority"

export interface FacilityBreakdownProps {
  data: Record<number, number>
  facilityNames: Record<number, string>
}

/** Per-facility note counts for the selected period. */
export const FacilityBreakdown: React.FC<FacilityBreakdownProps> = ({
  data,
  facilityNames,
}) => {
  const entries = Object.entries(data ?? {}).sort(([, a], [, b]) => b - a)
  const total = entries.reduce((sum, [, count]) => sum + count, 0)

  return (
    <Card>
      <CardHeader title="Notes by facility" />
      <CardBody>
        {entries.length === 0 ? (
          <EmptyState
            title="No facility activity"
            message="No notes were recorded at any facility in this period."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {entries.map(([facilityId, count]) => (
              <li
                key={facilityId}
                className="rounded-lg border border-ink-200 bg-ink-50 px-4 py-3"
              >
                <p className="truncate text-sm font-medium text-ink-700">
                  {facilityNames[Number(facilityId)] ?? `Facility ${facilityId}`}
                </p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tabular-nums text-ink-900">
                    {count}
                  </span>
                  <span className="text-xs text-ink-500">
                    {toPercentage(count, total).toFixed(0)}% of period
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
