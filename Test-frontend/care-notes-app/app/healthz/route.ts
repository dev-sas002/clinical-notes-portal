import { NextResponse } from "next/server"
import { dataSourceName } from "../../src/server/env"

export const dynamic = "force-dynamic"

/** Unauthenticated liveness probe used by the container healthcheck. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    dataSource: dataSourceName(),
  })
}
