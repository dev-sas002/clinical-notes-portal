import type React from "react"
import { cn } from "./cn"

export interface MeterProps {
  label: React.ReactNode
  value: number
  total: number
  percentage: number
  /** Tailwind background class for the filled portion. */
  barClass?: string
  /** Accessible name, when the visible label is not enough on its own. */
  ariaLabel?: string
}

/** A labelled horizontal bar. Every distribution panel uses this one. */
export const Meter: React.FC<MeterProps> = ({
  label,
  value,
  total,
  percentage,
  barClass = "bg-brand-600",
  ariaLabel,
}) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="truncate text-sm font-medium text-ink-700">{label}</span>
      <span className="shrink-0 text-sm tabular-nums text-ink-500">
        {value}
        <span className="ml-1.5 text-ink-400">{percentage.toFixed(1)}%</span>
      </span>
    </div>
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-ink-200"
      role="progressbar"
      aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", barClass)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
)
