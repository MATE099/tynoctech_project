import { NextResponse } from "next/server";
import { getOrCreateSessionId } from "../../../lib/session";
import {
  addItemToCart,
  buildCartSummary,
  getCart,
  removeItemFromCart,
  updateItemQuantity,
} from "../../../lib/db/cart";
import {
  addToCartSchema,
  updateCartQuantitySchema,
  removeFromCartSchema,
} from "../../../lib/validations/cart";

/**
 * Cart API.
 *   GET    /api/cart  -> current cart summary
 *   POST   /api/cart  -> add an item      { productId, quantity }
 *   PATCH  /api/cart  -> set a quantity   { productId, quantity }
 *   DELETE /api/cart  -> remove an item   { productId }
 *
 * Every mutation returns the full, recomputed cart summary so the UI never has
 * to guess the new state.
 */

export async function GET() {
  try {
    const sessionId = await getOrCreateSessionId();
    const cart = await getCart(sessionId);
    const summary = await buildCartSummary(cart);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("GET /api/cart failed:", error);
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Zod validates the shape BEFORE we touch the database.
    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const sessionId = await getOrCreateSessionId();
    const cart = await addItemToCart(
      sessionId,
      parsed.data.productId,
      parsed.data.quantity,
    );
    return NextResponse.json(await buildCartSummary(cart));
  } catch (error) {
    console.error("POST /api/cart failed:", error);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = updateCartQuantitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const sessionId = await getOrCreateSessionId();
    const cart = await updateItemQuantity(
      sessionId,
      parsed.data.productId,
      parsed.data.quantity,
    );
    return NextResponse.json(await buildCartSummary(cart));
  } catch (error) {
    console.error("PATCH /api/cart failed:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const parsed = removeFromCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const sessionId = await getOrCreateSessionId();
    const cart = await removeItemFromCart(sessionId, parsed.data.productId);
    return NextResponse.json(await buildCartSummary(cart));
  } catch (error) {
    console.error("DELETE /api/cart failed:", error);
    return NextResponse.json(
      { error: "Failed to remove item" },
      { status: 500 },
    );
  }
}
