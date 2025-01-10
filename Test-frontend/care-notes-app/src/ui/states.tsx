import type React from "react"
import { Button } from "./Button"
import { Spinner } from "./Spinner"

/**
 * The three states every asynchronous panel needs.
 *
 * They live together so that "loading", "failed" and "nothing here" look the
 * same wherever they appear, instead of each screen inventing its own
 * centred grey sentence.
 */

export const LoadingState: React.FC<{ label: string; rows?: number }> = ({
  label,
  rows = 3,
}) => (
  <div role="status" aria-live="polite" className="space-y-3">
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }, (_, index) => (
      <div
        key={index}
        aria-hidden="true"
        className="h-16 animate-pulse rounded-lg bg-ink-100"
      />
    ))}
  </div>
)

export const InlineSpinner: React.FC<{ label: string }> = ({ label }) => (
  <span
    className="inline-flex items-center gap-2 text-sm text-ink-500"
    role="status"
    aria-live="polite"
  >
    <Spinner />
    {label}
  </span>
)

export const ErrorState: React.FC<{
  title?: string
  message: string
  onRetry?: () => void
}> = ({ title = "Something went wrong", message, onRetry }) => (
  <div
    role="alert"
    className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700"
  >
    <p className="font-semibold">{title}</p>
    <p className="mt-1">{message}</p>
    {onRetry ? (
      <Button variant="danger" size="sm" className="mt-3" onClick={onRetry}>
        Try again
      </Button>
    ) : null}
  </div>
)

export const EmptyState: React.FC<{
  title: string
  message: string
  action?: React.ReactNode
}> = ({ title, message, action }) => (
  <div className="rounded-lg border border-dashed border-ink-300 bg-ink-50 px-6 py-10 text-center">
    <p className="text-sm font-semibold text-ink-700">{title}</p>
    <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{message}</p>
    {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
  </div>
)
