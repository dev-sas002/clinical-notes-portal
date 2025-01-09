import type React from "react"
import { Card, CardBody, CardHeader } from "../ui/Card"
import { Meter } from "../ui/Meter"
import { EmptyState } from "../ui/states"
import { getCategoryBarClass, getCategoryLabel, toPercentage } from "../utils/priority"

export interface CategoryChartProps {
  data: Record<string, number>
  title?: string
}

/** Notes grouped by category, largest first. */
export const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  title = "Notes by category",
}) => {
  const counts = data ?? {}
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0)
  const categories = Object.entries(counts).sort(([, a], [, b]) => b - a)

  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        {categories.length === 0 ? (
          <EmptyState
            title="No categories recorded"
            message="No notes fall inside the selected period."
          />
        ) : (
          <div className="space-y-4">
            {categories.map(([category, count]) => (
              <Meter
                key={category}
                label={getCategoryLabel(category)}
                value={count}
                total={total}
                percentage={toPercentage(count, total)}
                barClass={getCategoryBarClass(category)}
                ariaLabel={`${getCategoryLabel(category)} notes`}
              />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
