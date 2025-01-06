"use client"

import { useEffect } from "react"
import { Button } from "../src/ui/Button"
import { Card, CardBody, CardHeader } from "../src/ui/Card"

/**
 * Route-level error boundary. Without one, a render-time throw blanked the
 * whole page with no way back.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled render error", error)
  }, [error])

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader title="Something went wrong" />
      <CardBody className="space-y-4">
        <p className="text-sm text-ink-600">
          This screen could not be displayed. The error has been logged.
        </p>
        {error.digest ? (
          <p className="text-xs text-ink-400">Reference: {error.digest}</p>
        ) : null}
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </CardBody>
    </Card>
  )
}
