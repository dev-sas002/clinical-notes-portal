import type React from "react"

export interface StatTileProps {
  label: string
  value: number | string
  caption?: string
}

/** One headline number. Used by both the home panel and the dashboard. */
export const StatTile: React.FC<StatTileProps> = ({ label, value, caption }) => (
  <div className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold tabular-nums text-ink-900">{value}</p>
    {caption ? <p className="mt-1 text-sm text-ink-500">{caption}</p> : null}
  </div>
)
