import { NextResponse, type NextRequest } from "next/server"
import {
  gatewayErrorResponse,
  parseFacilityIds,
  parsePage,
  parsePageSize,
  requireSession,
} from "../../../src/server/api"
import { getGateway } from "../../../src/server/gateways"
import { parseNoteDraft } from "../../../src/utils/validateNote"

export const dynamic = "force-dynamic"

/**
 * List notes for the signed-in tenant.
 *
 * `tenant_id` is never read from the query string: it comes from the signed
 * session, so a crafted request cannot widen the scope.
 */
export async function GET(request: NextRequest) {
  const auth = await requireSession(request)
  if ("response" in auth) return auth.response

  const params = request.nextUrl.searchParams

  try {
    const page = await getGateway().listNotes({
      tenantId: auth.session.tenantId,
      facilityIds: parseFacilityIds(params, auth.session),
      page: parsePage(params),
      pageSize: parsePageSize(params),
    })
    return NextResponse.json(page, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return gatewayErrorResponse(error)
  }
}

/** Create a note inside the signed-in tenant. */
export async function POST(request: NextRequest) {
  const auth = await requireSession(request)
  if ("response" in auth) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 })
  }

  const parsed = parseNoteDraft((body ?? {}) as Record<string, never>)
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "The note was rejected.", fields: parsed.errors },
      { status: 422 },
    )
  }

  const requestedFacility = Number((body as { facility_id?: unknown }).facility_id)
  const granted = auth.session.facilities.map((facility) => facility.id)
  const facilityId = granted.includes(requestedFacility) ? requestedFacility : granted[0]

  if (facilityId == null) {
    return NextResponse.json(
      { error: "This account has no facility it may write to." },
      { status: 403 },
    )
  }

  try {
    const note = await getGateway().createNote({
      ...parsed.value,
      tenantId: auth.session.tenantId,
      facilityIds: [facilityId],
    })
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    return gatewayErrorResponse(error)
  }
}
