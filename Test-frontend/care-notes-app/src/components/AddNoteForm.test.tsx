import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AddNoteForm } from "./AddNoteForm"
import { renderWithStore } from "../test/renderWithStore"
import { errorResponse, jsonResponse, makeNote, makeSessionUser } from "../test/factories"
import { routerMock } from "../../vitest.setup"

const mockFetch = (response: Response) => {
  const spy = vi.fn().mockResolvedValue(response)
  vi.stubGlobal("fetch", spy)
  return spy
}

const fill = async () => {
  await userEvent.type(screen.getByLabelText("Patient ID"), "PT-1042")
  await userEvent.type(screen.getByLabelText("Care provider name"), "A. Rivera (RN)")
  await userEvent.type(screen.getByLabelText("Care note"), "Settled at handover.")
}

const renderForm = (props: Parameters<typeof AddNoteForm>[0] = {}) =>
  renderWithStore(<AddNoteForm {...props} />, { user: makeSessionUser() })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("AddNoteForm validation", () => {
  it("blocks an empty submission and says which fields are missing", async () => {
    const spy = mockFetch(jsonResponse(makeNote()))
    renderForm()

    await userEvent.click(screen.getByRole("button", { name: "Save note" }))

    expect(await screen.findByText("Patient ID is required.")).toBeInTheDocument()
    expect(screen.getByText("The note cannot be empty.")).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalled()
  })

  it("clears a field error once the user corrects it", async () => {
    mockFetch(jsonResponse(makeNote()))
    renderForm()

    await userEvent.click(screen.getByRole("button", { name: "Save note" }))
    await screen.findByText("Patient ID is required.")
    await userEvent.type(screen.getByLabelText("Patient ID"), "PT-1")

    expect(screen.queryByText("Patient ID is required.")).not.toBeInTheDocument()
  })

  it("marks an invalid control for assistive technology", async () => {
    mockFetch(jsonResponse(makeNote()))
    renderForm()

    await userEvent.click(screen.getByRole("button", { name: "Save note" }))

    expect(await screen.findByLabelText("Patient ID")).toHaveAttribute("aria-invalid", "true")
  })

  it("rejects whitespace-only content", async () => {
    const spy = mockFetch(jsonResponse(makeNote()))
    renderForm()

    await userEvent.type(screen.getByLabelText("Patient ID"), "PT-1")
    await userEvent.type(screen.getByLabelText("Care provider name"), "A")
    await userEvent.type(screen.getByLabelText("Care note"), "    ")
    await userEvent.click(screen.getByRole("button", { name: "Save note" }))

    expect(spy).not.toHaveBeenCalled()
  })
})

describe("AddNoteForm submission", () => {
  it("posts the trimmed draft with no tenant id", async () => {
    const spy = mockFetch(jsonResponse(makeNote()))
    renderForm()

    await fill()
    await userEvent.click(screen.getByRole("button", { name: "Save note" }))

    await waitFor(() => expect(spy).toHaveBeenCalled())
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toMatchObject({
      patient_id: "PT-1042",
      created_by: "A. Rivera (RN)",
      note_content: "Settled at handover.",
      category: "observation",
      priority: 3,
    })
    expect(body).not.toHaveProperty("tenant_id")
  })

  it("sends the facility the user chose", async () => {
    const spy = mockFetch(jsonResponse(makeNote()))
    renderForm()

    await userEvent.selectOptions(screen.getByLabelText("Facility"), "12")
    await fill()
    await userEvent.click(screen.getByRole("button", { name: "Save note" }))

    await waitFor(() => expect(spy).toHaveBeenCalled())
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.facility_id).toBe(12)
  })

  it("puts the created note into the store", async () => {
    mockFetch(jsonResponse(makeNote({ id: 4242 })))
    const { store } = renderForm()

    await fill()
    await userEvent.click(screen.getByRole("button", { name: "Save note" }))

    await waitFor(() => expect(store.getState().careNotes.notes.data[0]?.id).toBe(4242))
  })

  it("navigates back to the list after saving", async () => {
    mockFetch(jsonResponse(makeNote()))
    renderForm()

    await fill()
    await userEvent.click(screen.getByRole("button", { name: "Save note" }))

    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith("/"))
  })

  it("calls onSuccess instead of navigating when one is given", async () => {
    mockFetch(jsonResponse(makeNote()))
    const onSuccess = vi.fn()
    renderForm({ onSuccess })

    await fill()
    await userEvent.click(screen.getByRole("button", { name: "Save note" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(routerMock.push).not.toHaveBeenCalled()
  })

  it("shows the server's rejection instead of silently losing the note", async () => {
    mockFetch(errorResponse(422, { error: "The note was rejected." }))
    renderForm()

    await fill()
    await userEvent.click(screen.getByRole("button", { name: "Save note" }))

    expect(await screen.findByText("The note was rejected.")).toBeInTheDocument()
  })

  it("attaches server field errors to the right inputs", async () => {
    mockFetch(
      errorResponse(422, {
        error: "The note was rejected.",
        fields: { patient_id: "Unknown patient." },
      }),
    )
    renderForm()

    await fill()
    await userEvent.click(screen.getByRole("button", { name: "Save note" }))

    expect(await screen.findByText("Unknown patient.")).toBeInTheDocument()
  })

  it("keeps the typed values after a failure", async () => {
    mockFetch(errorResponse(500, { error: "Server error" }))
    renderForm()

    await fill()
    await userEvent.click(screen.getByRole("button", { name: "Save note" }))

    await screen.findByText("Server error")
    expect(screen.getByLabelText("Patient ID")).toHaveValue("PT-1042")
  })

  it("re-enables the submit button after a failure", async () => {
    mockFetch(errorResponse(500, { error: "Server error" }))
    renderForm()

    await fill()
    await userEvent.click(screen.getByRole("button", { name: "Save note" }))

    await screen.findByText("Server error")
    expect(screen.getByRole("button", { name: "Save note" })).toBeEnabled()
  })

  it("hides the facility picker when the account has only one", () => {
    renderWithStore(<AddNoteForm />, {
      user: makeSessionUser({ facilities: [{ id: 11, name: "Northfield House" }] }),
    })

    expect(screen.queryByLabelText("Facility")).not.toBeInTheDocument()
  })
})
