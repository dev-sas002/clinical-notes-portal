import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { NotesList, VIRTUALISE_ABOVE, type NotesListProps } from "./NotesList"
import { makeNote } from "../test/factories"

const renderList = (overrides: Partial<NotesListProps> = {}) => {
  const props: NotesListProps = {
    notes: [makeNote()],
    status: "succeeded",
    error: null,
    pagination: { currentPage: 1, totalPages: 1, totalItems: 1, pageSize: 20 },
    facilityNames: { 11: "Northfield House" },
    onPageChange: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  }
  return { ...render(<NotesList {...props} />), props }
}

const manyNotes = (count: number) =>
  Array.from({ length: count }, (_, index) => makeNote({ id: index + 1 }))

describe("NotesList states", () => {
  it("shows skeletons on the very first load", () => {
    renderList({ notes: [], status: "loading" })

    expect(screen.getByRole("status")).toHaveTextContent("Loading care notes")
  })

  it("does not blank an already-loaded list while a poll is in flight", () => {
    renderList({ status: "loading" })

    expect(screen.getByText(/Ate a full breakfast/)).toBeInTheDocument()
  })

  it("shows a retryable error when nothing could be loaded", async () => {
    const { props } = renderList({ notes: [], status: "failed", error: "Backend unreachable" })

    expect(screen.getByRole("alert")).toHaveTextContent("Backend unreachable")
    await userEvent.click(screen.getByRole("button", { name: /try again/i }))
    expect(props.onRetry).toHaveBeenCalled()
  })

  it("keeps the last good results visible when a refresh fails", () => {
    renderList({ status: "failed", error: "Backend unreachable" })

    expect(screen.getByText(/Ate a full breakfast/)).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent(/last results loaded/i)
  })

  it("offers an action from the empty state", () => {
    renderList({
      notes: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, pageSize: 20 },
      emptyAction: <a href="/add-note">Record a note</a>,
    })

    expect(screen.getByText(/No care notes here yet/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /record a note/i })).toBeInTheDocument()
  })
})

describe("NotesList pagination", () => {
  it("reports the window of rows being shown", () => {
    renderList({
      notes: manyNotes(20),
      pagination: { currentPage: 2, totalPages: 5, totalItems: 100, pageSize: 20 },
    })

    expect(screen.getByText(/21/)).toBeInTheDocument()
    expect(screen.getByText(/40/)).toBeInTheDocument()
  })

  it("disables Previous on the first page", () => {
    renderList()

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled()
  })

  it("disables Next on the last page", () => {
    renderList({
      pagination: { currentPage: 3, totalPages: 3, totalItems: 60, pageSize: 20 },
    })

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()
  })

  it("asks for the next page", async () => {
    const { props } = renderList({
      pagination: { currentPage: 1, totalPages: 4, totalItems: 80, pageSize: 20 },
    })

    await userEvent.click(screen.getByRole("button", { name: "Next" }))

    expect(props.onPageChange).toHaveBeenCalledWith(2)
  })

  it("asks for the previous page", async () => {
    const { props } = renderList({
      pagination: { currentPage: 3, totalPages: 4, totalItems: 80, pageSize: 20 },
    })

    await userEvent.click(screen.getByRole("button", { name: "Previous" }))

    expect(props.onPageChange).toHaveBeenCalledWith(2)
  })
})

describe("NotesList virtualisation", () => {
  it("renders every row for a short page", () => {
    renderList({
      notes: manyNotes(VIRTUALISE_ABOVE),
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: VIRTUALISE_ABOVE,
        pageSize: 100,
      },
    })

    expect(screen.queryByTestId("notes-scroller")).not.toBeInTheDocument()
    expect(screen.getAllByRole("article")).toHaveLength(VIRTUALISE_ABOVE)
  })

  it("windows a long page instead of mounting all of it", () => {
    renderList({
      notes: manyNotes(100),
      pagination: { currentPage: 1, totalPages: 1, totalItems: 100, pageSize: 100 },
    })

    expect(screen.getByTestId("notes-scroller")).toBeInTheDocument()
    expect(screen.getAllByRole("article").length).toBeLessThan(100)
  })

  it("still reports the full count while windowed", () => {
    renderList({
      notes: manyNotes(100),
      pagination: { currentPage: 1, totalPages: 2, totalItems: 200, pageSize: 100 },
    })

    expect(screen.getByText(/200/)).toBeInTheDocument()
  })
})
