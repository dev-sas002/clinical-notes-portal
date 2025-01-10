import { describe, expect, it } from "vitest"
import {
  selectFacilities,
  selectFacilityNames,
  selectIsSyncing,
  selectNotes,
  selectPageWindow,
} from "./selectors"
import { makeTestStore } from "../../test/renderWithStore"
import { makeNote, makeSessionUser } from "../../test/factories"

const stateWith = (overrides: Parameters<typeof makeTestStore>[0]) =>
  makeTestStore(overrides).getState()

describe("selectFacilities", () => {
  it("returns the session's facilities in id order", () => {
    const state = stateWith({
      user: makeSessionUser({
        facilities: [
          { id: 13, name: "Brookvale Court" },
          { id: 11, name: "Northfield House" },
        ],
      }),
    })

    expect(selectFacilities(state).map((facility) => facility.id)).toEqual([11, 13])
  })

  it("returns an empty list when nobody is signed in", () => {
    expect(selectFacilities(stateWith({ user: null }))).toEqual([])
  })

  it("keeps a stable reference between calls so memoised consumers do not re-render", () => {
    const state = stateWith({ user: makeSessionUser() })

    expect(selectFacilities(state)).toBe(selectFacilities(state))
  })
})

describe("selectFacilityNames", () => {
  it("maps ids to display names", () => {
    const state = stateWith({ user: makeSessionUser() })

    expect(selectFacilityNames(state)[11]).toBe("Northfield House")
  })
})

describe("selectIsSyncing", () => {
  it("is true while either resource is loading", () => {
    const state = stateWith({
      careNotes: { stats: { data: null, status: "loading", error: null, requestId: null } },
    })

    expect(selectIsSyncing(state)).toBe(true)
  })

  it("is false once both have settled", () => {
    expect(selectIsSyncing(stateWith({}))).toBe(false)
  })
})

describe("selectPageWindow", () => {
  it("describes the rows on the current page", () => {
    const state = stateWith({
      careNotes: {
        notes: {
          data: Array.from({ length: 20 }, (_, index) => makeNote({ id: index + 1 })),
          status: "succeeded",
          error: null,
          requestId: null,
        },
        pagination: { currentPage: 3, totalPages: 5, totalItems: 100, pageSize: 20 },
      },
    })

    expect(selectPageWindow(state)).toEqual({ first: 41, last: 60 })
  })

  it("reports a zero window for an empty page", () => {
    expect(
      selectPageWindow(
        stateWith({
          careNotes: { notes: { data: [], status: "succeeded", error: null, requestId: null } },
        }),
      ),
    ).toEqual({
      first: 0,
      last: 0,
    })
  })
})

describe("selectNotes", () => {
  it("unwraps the resource", () => {
    const state = stateWith({
      careNotes: {
        notes: { data: [makeNote()], status: "succeeded", error: null, requestId: null },
      },
    })

    expect(selectNotes(state)).toHaveLength(1)
  })
})
