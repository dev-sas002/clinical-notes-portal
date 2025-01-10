import { describe, expect, it } from "vitest"
import {
  MAX_PAGE_SIZE,
  parseDateRange,
  parseFacilityIds,
  parsePage,
  parsePageSize,
} from "./queryParams"
import type { Session } from "./session"

const params = (query: string) => new URLSearchParams(query)

const session: Session = {
  sub: "u-1",
  name: "A. Rivera (RN)",
  tenantId: 1,
  tenantName: "Northfield Care Group",
  facilities: [
    { id: 11, name: "Northfield House" },
    { id: 12, name: "Elmwood Lodge" },
  ],
  exp: Date.now() / 1000 + 600,
}

describe("parsePage", () => {
  it("reads a valid page", () => {
    expect(parsePage(params("page=4"))).toBe(4)
  })

  it.each(["", "page=0", "page=-2", "page=abc"])("falls back to 1 for %s", (query) => {
    expect(parsePage(params(query))).toBe(1)
  })
})

describe("parsePageSize", () => {
  it("defaults to 20", () => {
    expect(parsePageSize(params(""))).toBe(20)
  })

  it("caps an oversized page so one request cannot pull the whole table", () => {
    expect(parsePageSize(params("page_size=100000"))).toBe(MAX_PAGE_SIZE)
  })
})

describe("parseDateRange", () => {
  it("accepts a known range", () => {
    expect(parseDateRange(params("range=this_month"))).toBe("this_month")
  })

  it("rejects an unknown range rather than passing it upstream", () => {
    expect(parseDateRange(params("range=last_decade"))).toBe("today")
  })
})

describe("parseFacilityIds", () => {
  it("keeps facilities the session grants", () => {
    expect(parseFacilityIds(params("facility_ids=11,12"), session)).toEqual([11, 12])
  })

  it("silently drops a facility the session does not grant", () => {
    expect(parseFacilityIds(params("facility_ids=11,99"), session)).toEqual([11])
  })

  it("drops every facility belonging to another tenant", () => {
    expect(parseFacilityIds(params("facility_ids=21,22"), session)).toEqual([])
  })

  it("returns an empty filter when nothing was requested", () => {
    expect(parseFacilityIds(params(""), session)).toEqual([])
  })

  it("ignores non-numeric noise", () => {
    expect(parseFacilityIds(params("facility_ids=11,,abc"), session)).toEqual([11])
  })
})
