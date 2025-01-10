import type React from "react"
import { Card, CardBody, CardHeader } from "../ui/Card"
import { Meter } from "../ui/Meter"
import {
  PRIORITY_LEVELS,
  getPriorityBarClass,
  getPriorityLabel,
  toPercentage,
} from "../utils/priority"

export interface PriorityDistributionProps {
  data: Record<number, number>
}

/**
 * Every priority level, always all five rows.
 *
 * Showing the zeroes matters clinically: "no priority 5 notes today" is
 * information, and a chart that silently omitted the row could not say it.
 */
export const PriorityDistribution: React.FC<PriorityDistributionProps> = ({ data }) => {
  const counts = data ?? {}
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0)

  return (
    <Card>
      <CardHeader title="Notes by priority" description="1 is lowest, 5 is highest." />
      <CardBody>
        <div className="space-y-4">
          {PRIORITY_LEVELS.map((priority) => {
            const count = counts[priority] ?? 0
            return (
              <Meter
                key={priority}
                label={`P${priority} ${getPriorityLabel(priority)}`}
                value={count}
                total={total}
                percentage={toPercentage(count, total)}
                barClass={getPriorityBarClass(priority)}
                ariaLabel={`${getPriorityLabel(priority)} priority notes`}
              />
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}
