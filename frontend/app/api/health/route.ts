import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "../../../lib/db/health";

/**
 * GET /api/health -> 200 when every table is reachable, 503 otherwise.
 *
 * Monitors (Docker healthchecks, uptime services) only look at the status
 * code, so a broken database must produce a non-2xx response.
 *
 * This route is public, so it returns statuses only. The database address,
 * region and raw error messages stay on the password-protected dashboard.
 */
export async function GET() {
  const health = await checkDatabaseHealth();
  return NextResponse.json(
    {
      ok: health.ok,
      latencyMs: health.latencyMs,
      checkedAt: health.checkedAt,
      tables: health.tables.map(({ name, status }) => ({ name, status })),
    },
    {
      status: health.ok ? 200 : 503,
      // Always check live; a cached "healthy" answer would hide an outage.
      headers: { "Cache-Control": "no-store" },
    },
  );
}
