import type { CareNote, CareNoteCategory, CareNotePriority } from "../../types"

/**
 * Seeded, entirely synthetic care notes.
 *
 * Nothing here is real or plausible patient data: patients are opaque
 * `PT-####` codes, staff are single-initial placeholders, and the note text
 * is drawn from a small template list. The generator is deterministic given
 * the same seed and reference time, so screenshots and tests are stable.
 */

export interface DemoFacility {
  id: number
  name: string
}

export interface DemoTenant {
  id: number
  name: string
  facilities: DemoFacility[]
  /** Notes to generate for this tenant. */
  volume: number
}

export const DEMO_TENANTS: DemoTenant[] = [
  {
    id: 1,
    name: "Northfield Care Group",
    facilities: [
      { id: 11, name: "Northfield House" },
      { id: 12, name: "Elmwood Lodge" },
      { id: 13, name: "Brookvale Court" },
    ],
    volume: 460,
  },
  {
    id: 2,
    name: "Lakeside Homes",
    facilities: [
      { id: 21, name: "Lakeside Manor" },
      { id: 22, name: "Harbour View" },
    ],
    volume: 280,
  },
]

const STAFF = [
  "A. Rivera (RN)",
  "J. Okafor (RN)",
  "M. Lindqvist (HCA)",
  "S. Patel (RN)",
  "T. Nakamura (HCA)",
  "D. Boateng (Senior Carer)",
]

const CONTENT: Record<CareNoteCategory, string[]> = {
  medication: [
    "Morning medication round completed. All items signed for; no refusals recorded.",
    "Analgesia given as prescribed at 14:10. Resident reported relief within the hour.",
    "Evening dose withheld pending GP review; escalated to the shift lead and logged.",
    "New blister pack checked against the MAR chart. Two discrepancies raised with pharmacy.",
    "PRN medication requested and administered. Effect reviewed after 45 minutes.",
  ],
  observation: [
    "Ate a full breakfast and joined the morning activity group. Bright and settled.",
    "Slightly unsteady on transfer from chair to frame. Assisted and monitored throughout.",
    "Fluid intake below target for the shift. Encouraged and recorded on the fluid chart.",
    "Restless overnight, settled after 03:00. No further concerns before handover.",
    "Observations within the usual range for this resident. No escalation required.",
    "Declined lunch but accepted a fortified drink. Appetite to be reviewed tomorrow.",
  ],
  treatment: [
    "Dressing changed on the left lower leg. Wound clean, no sign of infection.",
    "Physiotherapy exercises completed with support. Tolerated the full set today.",
    "Pressure area care carried out on schedule. Skin intact at all checked sites.",
    "Podiatry visit completed. Follow-up booked for four weeks' time.",
    "Continence care provided and repositioning chart updated for the shift.",
  ],
}

const CATEGORIES: CareNoteCategory[] = ["medication", "observation", "treatment"]

/** Priority weighting: most notes are routine, a few are urgent. */
const PRIORITY_WEIGHTS: Array<[CareNotePriority, number]> = [
  [1, 22],
  [2, 30],
  [3, 28],
  [4, 14],
  [5, 6],
]

/** Small deterministic PRNG (mulberry32) so the seed fully fixes the output. */
const createRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T>(random: () => number, items: readonly T[]): T =>
  items[Math.floor(random() * items.length)]

const pickPriority = (random: () => number): CareNotePriority => {
  const total = PRIORITY_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = random() * total
  for (const [priority, weight] of PRIORITY_WEIGHTS) {
    roll -= weight
    if (roll <= 0) return priority
  }
  return 3
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Ages a note. A third of every tenant's notes land inside the last 24 hours
 * so that the default "Today" window is populated on first boot; the rest
 * spread back over roughly four months to give the wider ranges something to
 * show.
 */
const ageMs = (random: () => number, index: number, volume: number): number => {
  if (index < volume / 3) return Math.floor(random() * DAY_MS)
  const days = 1 + Math.floor(random() ** 2 * 120)
  return days * DAY_MS + Math.floor(random() * DAY_MS)
}

export interface GenerateOptions {
  seed?: number
  /** Reference "now"; every note is generated relative to it. */
  now?: number
}

/** Generate the full synthetic corpus, newest first. */
export const generateDemoNotes = ({
  seed = 20260923,
  now = Date.now(),
}: GenerateOptions = {}): CareNote[] => {
  const random = createRandom(seed)
  const notes: CareNote[] = []
  let nextId = 1000

  for (const tenant of DEMO_TENANTS) {
    for (let index = 0; index < tenant.volume; index += 1) {
      const facility = pick(random, tenant.facilities)
      const category = pick(random, CATEGORIES)
      const patientNumber = 1000 + Math.floor(random() * 120)

      notes.push({
        id: (nextId += 1),
        tenant_id: tenant.id,
        facility_id: facility.id,
        patient_id: `PT-${patientNumber}`,
        category,
        priority: pickPriority(random),
        created_at: new Date(now - ageMs(random, index, tenant.volume)).toISOString(),
        created_by: pick(random, STAFF),
        note_content: pick(random, CONTENT[category]),
      })
    }
  }

  return notes.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}
