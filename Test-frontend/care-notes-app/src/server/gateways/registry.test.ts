import { afterEach, describe, expect, it } from "vitest"
import { getGateway, registerGateway, registeredGateways, resetGateway } from "./index"
import type { CareNotesGateway } from "./types"

afterEach(() => {
  delete process.env.CARE_NOTES_DATA_SOURCE
  resetGateway()
})

const stub = (name: string): CareNotesGateway => ({
  name,
  listNotes: async () => ({
    notes: [],
    pagination: { total: 0, page: 1, page_size: 20, total_pages: 1 },
  }),
  getStats: async () => {
    throw new Error("not needed")
  },
  createNote: async () => {
    throw new Error("not needed")
  },
})

describe("gateway registry", () => {
  it("ships http and demo implementations", () => {
    expect(registeredGateways()).toEqual(expect.arrayContaining(["http", "demo"]))
  })

  it("defaults to the demo gateway", () => {
    expect(getGateway().name).toBe("demo")
  })

  it("selects a gateway by environment variable", () => {
    process.env.CARE_NOTES_DATA_SOURCE = "http"
    resetGateway()

    expect(getGateway().name).toBe("http")
  })

  it("memoises the instance so in-memory state survives requests", () => {
    expect(getGateway()).toBe(getGateway())
  })

  it("accepts a newly registered implementation - the extension seam", () => {
    registerGateway("fixture", () => stub("fixture"))
    process.env.CARE_NOTES_DATA_SOURCE = "fixture"
    resetGateway()

    expect(getGateway().name).toBe("fixture")
  })

  it("fails loudly on an unknown data source", () => {
    process.env.CARE_NOTES_DATA_SOURCE = "nope"
    resetGateway()

    expect(() => getGateway()).toThrow(/Unknown CARE_NOTES_DATA_SOURCE/)
  })
})
