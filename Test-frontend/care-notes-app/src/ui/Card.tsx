import type React from "react"
import { cn } from "./cn"

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <section
    className={cn("rounded-card border border-ink-200 bg-white shadow-card", className)}
    {...rest}
  >
    {children}
  </section>
)

interface CardHeaderProps {
  title: string
  description?: React.ReactNode
  /** Right-aligned controls: a filter, a count, a link. */
  actions?: React.ReactNode
  /** Heading level, so a card nested in a section keeps the outline sane. */
  as?: "h2" | "h3"
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  description,
  actions,
  as: Heading = "h2",
}) => (
  <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-200 px-5 py-4">
    <div className="min-w-0">
      <Heading className="text-sm font-semibold uppercase tracking-wide text-ink-500">
        {title}
      </Heading>
      {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
    </div>
    {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
  </header>
)

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div className={cn("p-5", className)} {...rest}>
    {children}
  </div>
)
