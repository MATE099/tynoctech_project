import { NextResponse } from "next/server";
import { getStoreStats } from "../../../../lib/db/stats";

/** GET /api/admin/stats -> the dashboard's top-level counts. */
export async function GET() {
  try {
    return NextResponse.json(await getStoreStats());
  } catch (error) {
    console.error("GET /api/admin/stats failed:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
