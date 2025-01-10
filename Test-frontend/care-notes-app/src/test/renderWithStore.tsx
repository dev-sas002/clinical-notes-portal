import type React from "react"
import { render } from "@testing-library/react"
import { Provider } from "react-redux"
import { makeStore, type PreloadedAppState } from "../app/store"
import { rootReducer } from "../app/store"
import type { CareNotesState, SessionUser } from "../types"

export interface StoreOverrides {
  careNotes?: Partial<CareNotesState>
  user?: SessionUser | null
}

const baseState = () => rootReducer(undefined, { type: "@@init" })

export const makeTestStore = ({ careNotes, user }: StoreOverrides = {}) => {
  const initial = baseState()
  const preloaded: PreloadedAppState = {
    careNotes: careNotes ? { ...initial.careNotes, ...careNotes } : initial.careNotes,
    session: { user: user ?? null },
  }
  return makeStore(preloaded)
}

/** Render a component with a real (but isolated) Redux store attached. */
export const renderWithStore = (ui: React.ReactElement, overrides: StoreOverrides = {}) => {
  const store = makeTestStore(overrides)
  return {
    store,
    ...render(<Provider store={store}>{ui}</Provider>),
  }
}
