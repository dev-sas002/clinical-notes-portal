import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { FilterBar, type FilterBarProps } from "./FilterBar"

const renderBar = (overrides: Partial<FilterBarProps> = {}) => {
  const props: FilterBarProps = {
    facilities: [
      { id: 11, name: "Northfield House" },
      { id: 12, name: "Elmwood Lodge" },
    ],
    selectedFacilityIds: [],
    dateRange: "today",
    pageSize: 20,
    onFacilityToggle: vi.fn(),
    onAllFacilities: vi.fn(),
    onDateRangeChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    ...overrides,
  }
  return { ...render(<FilterBar {...props} />), props }
}

describe("FilterBar", () => {
  it("offers no tenant picker - the tenant comes from the session", () => {
    renderBar()

    expect(screen.queryByLabelText(/tenant/i)).not.toBeInTheDocument()
  })

  it("only offers facilities the session granted", () => {
    renderBar()

    expect(screen.getByRole("button", { name: "Northfield House" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Lakeside Manor" })).not.toBeInTheDocument()
  })

  it("marks 'All facilities' as pressed when nothing is filtered", () => {
    renderBar()

    expect(screen.getByRole("button", { name: "All facilities" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })

  it("toggles a facility", async () => {
    const { props } = renderBar()

    await userEvent.click(screen.getByRole("button", { name: "Elmwood Lodge" }))

    expect(props.onFacilityToggle).toHaveBeenCalledWith(12)
  })

  it("marks a selected facility as pressed", () => {
    renderBar({ selectedFacilityIds: [12] })

    expect(screen.getByRole("button", { name: "Elmwood Lodge" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })

  it("clears the filter", async () => {
    const { props } = renderBar({ selectedFacilityIds: [11] })

    await userEvent.click(screen.getByRole("button", { name: "All facilities" }))

    expect(props.onAllFacilities).toHaveBeenCalled()
  })

  it("changes the statistics period", async () => {
    const { props } = renderBar()

    await userEvent.selectOptions(screen.getByLabelText("Statistics period"), "this_month")

    expect(props.onDateRangeChange).toHaveBeenCalledWith("this_month")
  })

  it("changes the page size", async () => {
    const { props } = renderBar()

    await userEvent.selectOptions(screen.getByLabelText("Notes per page"), "100")

    expect(props.onPageSizeChange).toHaveBeenCalledWith(100)
  })

  it("says plainly that the period applies to statistics only", () => {
    renderBar()

    expect(screen.getByText(/period applies to the statistics panels/i)).toBeInTheDocument()
  })
})
