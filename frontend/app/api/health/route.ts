import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "../../../lib/db/health";

/**
 * GET /api/health -> 200 when every table is reachable, 503 otherwise.
 *
 * Monitors (Docker healthchecks, uptime services) only look at the status
 * code, so a broken database must produce a non-2xx response.
 */
export async function GET() {
  const health = await checkDatabaseHealth();
  return NextResponse.json(health, {
    status: health.ok ? 200 : 503,
    // Always check live; a cached "healthy" answer would hide an outage.
    headers: { "Cache-Control": "no-store" },
  });
}
