import type React from "react"
import { cn } from "./cn"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Tailwind classes for background and text, usually from a token map. */
  tone?: string
}

export const Badge: React.FC<BadgeProps> = ({
  tone = "bg-ink-100 text-ink-700",
  className,
  ...rest
}) => (
  <span
    className={cn(
      "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
      tone,
      className,
    )}
    {...rest}
  />
)
