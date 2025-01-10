import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SignInForm } from "./SignInForm"
import { errorResponse, jsonResponse, makeSessionUser } from "../test/factories"
import { routerMock } from "../../vitest.setup"

const mockFetch = (response: Response) => {
  const spy = vi.fn().mockResolvedValue(response)
  vi.stubGlobal("fetch", spy)
  return spy
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("SignInForm", () => {
  it("does not offer a tenant choice", () => {
    render(<SignInForm />)

    expect(screen.queryByLabelText(/tenant/i)).not.toBeInTheDocument()
  })

  it("posts the credentials and lands on the app", async () => {
    const spy = mockFetch(jsonResponse({ user: makeSessionUser() }))
    render(<SignInForm />)

    await userEvent.type(screen.getByLabelText("Email"), "a.rivera@northfield.example")
    await userEvent.type(screen.getByLabelText("Password"), "demo-pass")
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }))

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/"))
    expect(spy.mock.calls[0][0]).toBe("/api/session")
  })

  it("shows the server's message when the credentials are wrong", async () => {
    mockFetch(errorResponse(401, { error: "Email or password is incorrect." }))
    render(<SignInForm />)

    await userEvent.type(screen.getByLabelText("Email"), "a@b.example")
    await userEvent.type(screen.getByLabelText("Password"), "wrong")
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByText("Email or password is incorrect.")).toBeInTheDocument()
  })

  it("re-enables the button after a failure", async () => {
    mockFetch(errorResponse(401, { error: "Email or password is incorrect." }))
    render(<SignInForm />)

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }))

    await screen.findByText("Email or password is incorrect.")
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled()
  })

  it("hides the demo hint when no demo accounts are offered", () => {
    render(<SignInForm />)

    expect(screen.queryByText(/Demo accounts/)).not.toBeInTheDocument()
  })

  it("fills the form from a demo account hint", async () => {
    render(
      <SignInForm
        demoAccounts={[{ email: "a.rivera@northfield.example", tenantName: "Northfield" }]}
        demoPassword="demo-pass"
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /a.rivera@northfield.example/ }))

    expect(screen.getByLabelText("Email")).toHaveValue("a.rivera@northfield.example")
    expect(screen.getByLabelText("Password")).toHaveValue("demo-pass")
  })
})
