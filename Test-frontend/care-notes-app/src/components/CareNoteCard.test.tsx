import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CareNoteCard } from "./CareNoteCard"
import { makeNote } from "../test/factories"

describe("CareNoteCard", () => {
  it("renders the note body - the field the audit found was never displayed", () => {
    render(<CareNoteCard note={makeNote({ note_content: "Fluids encouraged." })} />)

    expect(screen.getByText("Fluids encouraged.")).toBeInTheDocument()
  })

  it("shows the patient identifier", () => {
    render(<CareNoteCard note={makeNote({ patient_id: "PT-1042" })} />)

    expect(screen.getByText("Patient PT-1042")).toBeInTheDocument()
  })

  it("labels priority 5 as the highest, matching the form", () => {
    render(<CareNoteCard note={makeNote({ priority: 5 })} />)

    expect(screen.getByText(/P5 Highest/)).toBeInTheDocument()
  })

  it("labels priority 1 as the lowest", () => {
    render(<CareNoteCard note={makeNote({ priority: 1 })} />)

    expect(screen.getByText(/P1 Lowest/)).toBeInTheDocument()
  })

  it("prefers the resolved facility name over the raw id", () => {
    render(<CareNoteCard note={makeNote()} facilityName="Northfield House" />)

    expect(screen.getByText(/Northfield House/)).toBeInTheDocument()
  })

  it("falls back to the facility id when no name is known", () => {
    render(<CareNoteCard note={makeNote({ facility_id: 77 })} />)

    expect(screen.getByText(/Facility 77/)).toBeInTheDocument()
  })

  it("exposes a machine-readable timestamp", () => {
    const note = makeNote()
    const { container } = render(<CareNoteCard note={note} />)

    expect(container.querySelector("time")).toHaveAttribute("datetime", note.created_at)
  })

  it("renders the category label, not the raw enum value", () => {
    render(<CareNoteCard note={makeNote({ category: "medication" })} />)

    expect(screen.getByText("Medication")).toBeInTheDocument()
  })
})
