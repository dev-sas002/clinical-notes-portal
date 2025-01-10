import type React from "react"
import { cn } from "./cn"

export const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <span
    aria-hidden="true"
    className={cn(
      "inline-block animate-spin rounded-full border-2 border-ink-300 border-t-brand-600",
      className ?? "h-4 w-4",
    )}
  />
)
