import { NextResponse } from "next/server";
import { getUserOverview } from "../../../../../lib/services/inspector";

/**
 * GET /api/admin/users/:id -> the user plus their cart and wishlist, each item
 * resolved against the Products table (product: null = deleted product).
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/admin/users/[id]">,
) {
  const { id } = await params;

  try {
    const overview = await getUserOverview(id);
    if (!overview) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(overview);
  } catch (error) {
    console.error(`GET /api/admin/users/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to load user" },
      { status: 500 },
    );
  }
}
