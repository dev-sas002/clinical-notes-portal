import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PriorityDistribution } from "./PriorityDistribution"

describe("PriorityDistribution", () => {
  it("always shows all five levels, including the empty ones", () => {
    render(<PriorityDistribution data={{ 3: 4 }} />)

    expect(screen.getAllByRole("progressbar")).toHaveLength(5)
  })

  it("orders the rows from lowest to highest", () => {
    render(<PriorityDistribution data={{ 1: 1, 5: 1 }} />)

    const labels = screen
      .getAllByRole("progressbar")
      .map((bar) => bar.getAttribute("aria-label"))
    expect(labels[0]).toBe("Lowest priority notes")
    expect(labels[4]).toBe("Highest priority notes")
  })

  it("computes the share against the total across levels", () => {
    render(<PriorityDistribution data={{ 1: 1, 2: 1, 3: 1, 4: 1 }} />)

    expect(screen.getAllByText("25.0%")).toHaveLength(4)
  })

  it("shows zero without dividing by zero", () => {
    render(<PriorityDistribution data={{}} />)

    expect(screen.getAllByText("0.0%")).toHaveLength(5)
  })

  it("states the direction of the scale so it cannot be misread", () => {
    render(<PriorityDistribution data={{}} />)

    expect(screen.getByText(/1 is lowest, 5 is highest/)).toBeInTheDocument()
  })
})
