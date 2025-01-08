import { NextResponse, type NextRequest } from "next/server"
import {
  gatewayErrorResponse,
  parseDateRange,
  parseFacilityIds,
  requireSession,
} from "../../../src/server/api"
import { getGateway } from "../../../src/server/gateways"
import { statsCache } from "../../../src/server/statsCache"

export const dynamic = "force-dynamic"

/**
 * Aggregate statistics for the signed-in tenant.
 *
 * Every open tab polls this once a minute, and the aggregation is the most
 * expensive call in the system, so identical queries are served from a short
 * in-process cache. See README "Design notes".
 */
export async function GET(request: NextRequest) {
  const auth = await requireSession(request)
  if ("response" in auth) return auth.response

  const params = request.nextUrl.searchParams
  const query = {
    tenantId: auth.session.tenantId,
    facilityIds: parseFacilityIds(params, auth.session),
    range: parseDateRange(params),
  }

  try {
    const stats = await statsCache.resolve(query, () => getGateway().getStats(query))
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return gatewayErrorResponse(error)
  }
}
