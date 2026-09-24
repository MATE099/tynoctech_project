import { NextResponse } from "next/server";
import { getInspectorData } from "../../../../lib/services/inspector";

/**
 * GET /api/admin/inspector -> every cart and wishlist with its owner resolved,
 * per-product reference counts, and summary stats.
 */
export async function GET() {
  try {
    return NextResponse.json(await getInspectorData());
  } catch (error) {
    console.error("GET /api/admin/inspector failed:", error);
    return NextResponse.json(
      { error: "Failed to load cart and wishlist data" },
      { status: 500 },
    );
  }
}
