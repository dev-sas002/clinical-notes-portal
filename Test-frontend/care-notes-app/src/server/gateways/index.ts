import { backendUrl, dataSourceName } from "../env"
import { DemoCareNotesGateway } from "./demoGateway"
import { HttpCareNotesGateway } from "./httpGateway"
import type { CareNotesGateway } from "./types"

export type GatewayFactory = () => CareNotesGateway

/**
 * The extension point.
 *
 * `CARE_NOTES_DATA_SOURCE` selects one of these by name. A new backing store
 * is one class implementing `CareNotesGateway` plus one `registerGateway`
 * call - route handlers, the Redux slice and every component stay untouched.
 */
const registry = new Map<string, GatewayFactory>([
  ["http", () => new HttpCareNotesGateway(backendUrl())],
  ["demo", () => new DemoCareNotesGateway()],
])

export const registerGateway = (name: string, factory: GatewayFactory): void => {
  registry.set(name, factory)
}

export const registeredGateways = (): string[] => [...registry.keys()]

let instance: CareNotesGateway | null = null
let instanceName: string | null = null

/**
 * Resolve the configured gateway. Memoised because `DemoCareNotesGateway`
 * holds its corpus in memory and must survive across requests for a created
 * note to show up in the list afterwards.
 */
export const getGateway = (): CareNotesGateway => {
  const name = dataSourceName()
  if (instance && instanceName === name) return instance

  const factory = registry.get(name)
  if (!factory) {
    throw new Error(
      `Unknown CARE_NOTES_DATA_SOURCE "${name}". Known values: ${registeredGateways().join(", ")}.`,
    )
  }

  instance = factory()
  instanceName = name
  return instance
}

/** Drop the memoised gateway. Used by tests that change the environment. */
export const resetGateway = (): void => {
  instance = null
  instanceName = null
}

export type { CareNotesGateway } from "./types"
