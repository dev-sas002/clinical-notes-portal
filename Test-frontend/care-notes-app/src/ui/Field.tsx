"use client"

import type React from "react"
import { useId } from "react"
import { cn } from "./cn"

const CONTROL =
  "block w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-800 " +
  "placeholder:text-ink-400 disabled:bg-ink-100 disabled:text-ink-400"

const CONTROL_INVALID = "border-danger-600 bg-danger-50"

interface FieldShellProps {
  label: string
  /** Help text rendered under the control when there is no error. */
  hint?: string
  error?: string
  children: (props: {
    id: string
    "aria-describedby": string | undefined
    "aria-invalid": boolean | undefined
    className: string
  }) => React.ReactNode
}

/**
 * Label, control, hint and error in one place.
 *
 * Every form control in the app goes through this, so the association
 * between a label, its input and its error message cannot be forgotten - the
 * add-note form previously rendered `required` inputs inside a `noValidate`
 * form, which meant no validation at all and no error text anywhere.
 */
export const Field: React.FC<FieldShellProps> = ({ label, hint, error, children }) => {
  const id = useId()
  const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
      </label>
      {children({
        id,
        "aria-describedby": messageId,
        "aria-invalid": error ? true : undefined,
        className: cn(CONTROL, error && CONTROL_INVALID),
      })}
      {error ? (
        <p id={messageId} role="alert" className="mt-1.5 text-sm text-danger-700">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1.5 text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Standalone select for filter bars, where there is no validation state. */
export const SelectControl: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className,
  ...rest
}) => <select className={cn(CONTROL, "pr-8", className)} {...rest} />
