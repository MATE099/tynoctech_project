import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb } from "../dynamodb";
import { getProductById } from "./products";
import { scanAll } from "./scan";
import { Cart, CartLine, CartSummary } from "../../types";

const CARTS_TABLE = process.env.CARTS_TABLE_NAME || "Carts";

/**
 * The stored cart row for one owner, or null if they never added anything.
 *
 * The table key `id` is the OWNER's id: a guest session id from the
 * tynoc_session cookie, or a registered user's id. Either way a direct key
 * lookup (GetCommand) is the fastest, cheapest read DynamoDB offers.
 *
 * Unlike getCart(), this does not invent an empty cart, so the admin can tell
 * "no cart row exists" apart from "a cart exists but is empty".
 */
export async function getCartByOwner(ownerId: string): Promise<Cart | null> {
  const response = await dynamodb.send(
    new GetCommand({ TableName: CARTS_TABLE, Key: { id: ownerId } }),
  );
  return (response.Item as Cart) ?? null;
}

/** Every cart row in the table, for the admin inspector. */
export async function getAllCarts(): Promise<Cart[]> {
  return scanAll<Cart>(CARTS_TABLE);
}

/**
 * Load a cart by id. If it doesn't exist yet, return an empty in-memory cart
 * (we only write to the table once the user actually adds something).
 */
export async function getCart(cartId: string): Promise<Cart> {
  const response = await dynamodb.send(
    new GetCommand({ TableName: CARTS_TABLE, Key: { id: cartId } }),
  );

  return (
    (response.Item as Cart) ?? {
      id: cartId,
      items: [],
      updatedAt: new Date().toISOString(),
    }
  );
}

/** Persist the whole cart item (overwrites the previous version). */
async function saveCart(cart: Cart): Promise<Cart> {
  const updated: Cart = { ...cart, updatedAt: new Date().toISOString() };
  await dynamodb.send(
    new PutCommand({ TableName: CARTS_TABLE, Item: updated }),
  );
  return updated;
}

/**
 * Add a product to the cart.
 *
 * BUSINESS LOGIC enforced here (the data layer, so every caller is protected):
 *   - The product must exist            -> throws "PRODUCT_NOT_FOUND"
 *   - There must be enough stock        -> throws "INSUFFICIENT_STOCK"
 *   - DUPLICATE PREVENTION: if the product is already in the cart we increase
 *     its quantity instead of adding a second line for the same product.
 */
export async function addItemToCart(
  cartId: string,
  productId: string,
  quantity: number,
): Promise<Cart> {
  // Always read the product from the DB so stock is authoritative.
  const product = await getProductById(productId);
  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  const cart = await getCart(cartId);
  const existing = cart.items.find((item) => item.productId === productId);
  const requestedTotal = (existing?.quantity ?? 0) + quantity;

  // Reject if the requested total quantity exceeds available stock.
  if (requestedTotal > product.stock) {
    throw new Error("INSUFFICIENT_STOCK");
  }

  if (existing) {
    existing.quantity = requestedTotal;
  } else {
    cart.items.push({ productId, quantity });
  }

  return saveCart(cart);
}

/**
 * Set an exact quantity for a product already in the cart.
 * A quantity of 0 (or less) removes the line entirely.
 */
export async function updateItemQuantity(
  cartId: string,
  productId: string,
  quantity: number,
): Promise<Cart> {
  const cart = await getCart(cartId);

  if (quantity <= 0) {
    cart.items = cart.items.filter((item) => item.productId !== productId);
  } else {
    const existing = cart.items.find((item) => item.productId === productId);
    if (existing) {
      existing.quantity = quantity;
    }
  }

  return saveCart(cart);
}

/** Remove a single product from the cart. */
export async function removeItemFromCart(
  cartId: string,
  productId: string,
): Promise<Cart> {
  const cart = await getCart(cartId);
  cart.items = cart.items.filter((item) => item.productId !== productId);
  return saveCart(cart);
}

/**
 * Build the "summary" the UI needs: each item joined with its product plus a
 * line total, the overall subtotal, and the total number of units.
 *
 * Prices always come from the Products table (never trust a price sent by the
 * client), so the subtotal can't be tampered with.
 */
export async function buildCartSummary(cart: Cart): Promise<CartSummary> {
  const lines: CartLine[] = [];

  for (const item of cart.items) {
    const product = await getProductById(item.productId);

    // Skip items whose product no longer exists.
    if (!product) continue;

    lines.push({
      product,
      quantity: item.quantity,
      lineTotal: product.price * item.quantity,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  // Round to 2 decimals to avoid floating point noise (e.g. 0.1 + 0.2).
  return {
    items: lines,
    subtotal: Math.round(subtotal * 100) / 100,
    itemCount,
  };
}
