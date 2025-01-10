import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CategoryChart } from "./CategoryChart"

describe("CategoryChart", () => {
  it("renders one bar per category", () => {
    render(<CategoryChart data={{ medication: 5, observation: 3, treatment: 2 }} />)

    expect(screen.getAllByRole("progressbar")).toHaveLength(3)
  })

  it("orders categories by count, largest first", () => {
    render(<CategoryChart data={{ medication: 1, observation: 9, treatment: 4 }} />)

    const labels = screen
      .getAllByRole("progressbar")
      .map((bar) => bar.getAttribute("aria-label"))
    expect(labels).toEqual(["Observation notes", "Treatment notes", "Medication notes"])
  })

  it("shows the count and its share", () => {
    render(<CategoryChart data={{ medication: 1, observation: 3 }} />)

    expect(screen.getByText("75.0%")).toBeInTheDocument()
  })

  it("uses the display label rather than the raw enum", () => {
    render(<CategoryChart data={{ medication: 1 }} />)

    expect(screen.getByText("Medication")).toBeInTheDocument()
  })

  it("shows an empty state rather than a blank card", () => {
    render(<CategoryChart data={{}} />)

    expect(screen.getByText(/No categories recorded/)).toBeInTheDocument()
  })

  it("survives a null payload from an older API response", () => {
    render(<CategoryChart data={null as unknown as Record<string, number>} />)

    expect(screen.getByText(/No categories recorded/)).toBeInTheDocument()
  })

  it("accepts a custom title", () => {
    render(<CategoryChart data={{ medication: 1 }} title="Breakdown" />)

    expect(screen.getByRole("heading", { name: "Breakdown" })).toBeInTheDocument()
  })
})
