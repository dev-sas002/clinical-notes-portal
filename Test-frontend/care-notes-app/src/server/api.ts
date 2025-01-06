import { NextResponse, type NextRequest } from "next/server"
import { GatewayError } from "./gateways/types"
import { SESSION_COOKIE_NAME, unsealSession, type Session } from "./session"

export {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  parseDateRange,
  parseFacilityIds,
  parsePage,
  parsePageSize,
} from "./queryParams"

/** JSON error body shared by every route handler. */
export const errorResponse = (message: string, status: number): NextResponse =>
  NextResponse.json({ error: message }, { status })

/**
 * Read the signed session off the request, or answer 401.
 *
 * Returning a union rather than throwing keeps the handlers linear and makes
 * the "no session means no data" path impossible to forget.
 */
export const requireSession = async (
  request: NextRequest,
): Promise<{ session: Session } | { response: NextResponse }> => {
  const session = await unsealSession(request.cookies.get(SESSION_COOKIE_NAME)?.value)
  if (!session) return { response: errorResponse("Not signed in.", 401) }
  return { session }
}

/** Turn a gateway failure into the response the browser should see. */
export const gatewayErrorResponse = (error: unknown): NextResponse => {
  if (error instanceof GatewayError) {
    // Upstream 5xx is reported as 502 so a backend stack trace never leaks
    // through; a genuine client error is forwarded as-is.
    const status = error.status >= 400 && error.status < 500 ? error.status : 502
    return errorResponse(error.message, status)
  }
  console.error("Unhandled gateway error", error)
  return errorResponse("Unexpected server error.", 500)
}
