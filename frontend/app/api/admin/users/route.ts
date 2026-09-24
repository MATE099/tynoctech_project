import { NextResponse } from "next/server";
import {
  filterUsers,
  getUsersWithActivity,
} from "../../../../lib/services/inspector";

/**
 * GET /api/admin/users?q=... -> users with cart/wishlist activity counts.
 * (The public /api/users route stays as-is for the storefront.)
 */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? undefined;

  try {
    const users = filterUsers(await getUsersWithActivity(), query);
    return NextResponse.json({ count: users.length, users });
  } catch (error) {
    console.error("GET /api/admin/users failed:", error);
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 },
    );
  }
}
