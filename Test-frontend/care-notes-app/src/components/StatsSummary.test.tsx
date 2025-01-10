import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { StatsSummary } from "./StatsSummary"
import { makeStats } from "../test/factories"

describe("StatsSummary", () => {
  it("shows the four headline numbers", () => {
    render(
      <StatsSummary
        stats={makeStats()}
        status="succeeded"
        error={null}
        periodLabel="Today"
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText("Total notes")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("2.5")).toBeInTheDocument()
  })

  it("labels the tiles with the selected period", () => {
    render(
      <StatsSummary
        stats={makeStats()}
        status="succeeded"
        error={null}
        periodLabel="This month"
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText("This month")).toBeInTheDocument()
  })

  it("shows skeletons before the first load completes", () => {
    render(
      <StatsSummary
        stats={null}
        status="loading"
        error={null}
        periodLabel="Today"
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByRole("status")).toHaveTextContent("Loading statistics")
  })

  it("offers a retry when the first load failed", async () => {
    const onRetry = vi.fn()
    render(
      <StatsSummary
        stats={null}
        status="failed"
        error="Stats unavailable"
        periodLabel="Today"
        onRetry={onRetry}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /try again/i }))

    expect(onRetry).toHaveBeenCalled()
  })

  it("keeps showing the last good numbers when a refresh fails", () => {
    render(
      <StatsSummary
        stats={makeStats({ total_notes: 42 })}
        status="failed"
        error="Stats unavailable"
        periodLabel="Today"
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("renders zeroes rather than NaN when the aggregate is empty", () => {
    render(
      <StatsSummary
        stats={makeStats({
          total_notes: 0,
          by_category: {},
          by_facility: {},
          avg_notes_per_patient: 0,
        })}
        status="succeeded"
        error={null}
        periodLabel="Today"
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText("0.0")).toBeInTheDocument()
  })
})
