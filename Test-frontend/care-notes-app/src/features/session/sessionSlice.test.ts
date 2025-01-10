import { describe, expect, it } from "vitest"
import reducer, { initialState, sessionCleared, sessionReceived } from "./sessionSlice"
import { makeSessionUser } from "../../test/factories"

describe("session slice", () => {
  it("starts signed out", () => {
    expect(initialState.user).toBeNull()
  })

  it("stores the user the server resolved", () => {
    const user = makeSessionUser()

    expect(reducer(initialState, sessionReceived(user)).user).toEqual(user)
  })

  it("clears the user on sign-out", () => {
    const signedIn = reducer(initialState, sessionReceived(makeSessionUser()))

    expect(reducer(signedIn, sessionCleared()).user).toBeNull()
  })

  it("exposes no action that could change the tenant on its own", () => {
    expect(Object.keys({ sessionReceived, sessionCleared })).toEqual([
      "sessionReceived",
      "sessionCleared",
    ])
  })
})
