import { NextResponse } from "next/server";
import { getOrCreateSessionId } from "../../../lib/session";
import {
  addToWishlist,
  buildWishlistLines,
  getWishlist,
  removeFromWishlist,
} from "../../../lib/db/wishlist";
import {
  addToWishlistSchema,
  removeFromWishlistSchema,
} from "../../../lib/validations/wishlist";

/**
 * Wishlist API.
 *   GET    /api/wishlist -> current wishlist lines
 *   POST   /api/wishlist -> add a product    { productId }
 *   DELETE /api/wishlist -> remove a product { productId }
 */

export async function GET() {
  try {
    const sessionId = await getOrCreateSessionId();
    const wishlist = await getWishlist(sessionId);
    const items = await buildWishlistLines(wishlist);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/wishlist failed:", error);
    return NextResponse.json(
      { error: "Failed to load wishlist" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = addToWishlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const sessionId = await getOrCreateSessionId();
    const wishlist = await addToWishlist(sessionId, parsed.data.productId);
    return NextResponse.json({ items: await buildWishlistLines(wishlist) });
  } catch (error) {
    console.error("POST /api/wishlist failed:", error);
    return NextResponse.json(
      { error: "Failed to add to wishlist" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const parsed = removeFromWishlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const sessionId = await getOrCreateSessionId();
    const wishlist = await removeFromWishlist(sessionId, parsed.data.productId);
    return NextResponse.json({ items: await buildWishlistLines(wishlist) });
  } catch (error) {
    console.error("DELETE /api/wishlist failed:", error);
    return NextResponse.json(
      { error: "Failed to remove from wishlist" },
      { status: 500 },
    );
  }
}
