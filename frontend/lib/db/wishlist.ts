import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb } from "../dynamodb";
import { getProductById } from "./products";
import { Wishlist, WishlistLine } from "../../types";

const WISHLISTS_TABLE = process.env.WISHLISTS_TABLE_NAME || "Wishlists";

/** Load a wishlist by id, or return an empty one if none exists yet. */
export async function getWishlist(wishlistId: string): Promise<Wishlist> {
  const response = await dynamodb.send(
    new GetCommand({ TableName: WISHLISTS_TABLE, Key: { id: wishlistId } }),
  );

  return (
    (response.Item as Wishlist) ?? {
      id: wishlistId,
      items: [],
      updatedAt: new Date().toISOString(),
    }
  );
}

async function saveWishlist(wishlist: Wishlist): Promise<Wishlist> {
  const updated: Wishlist = {
    ...wishlist,
    updatedAt: new Date().toISOString(),
  };
  await dynamodb.send(
    new PutCommand({ TableName: WISHLISTS_TABLE, Item: updated }),
  );
  return updated;
}

/**
 * Add a product to the wishlist.
 * DUPLICATE PREVENTION: a wishlist is a set, so if the product is already there
 * we simply return the wishlist unchanged (no quantities here).
 */
export async function addToWishlist(
  wishlistId: string,
  productId: string,
): Promise<Wishlist> {
  const wishlist = await getWishlist(wishlistId);
  const alreadyThere = wishlist.items.some(
    (item) => item.productId === productId,
  );

  if (alreadyThere) {
    return wishlist;
  }

  wishlist.items.push({ productId, addedAt: new Date().toISOString() });
  return saveWishlist(wishlist);
}

/** Remove a product from the wishlist. */
export async function removeFromWishlist(
  wishlistId: string,
  productId: string,
): Promise<Wishlist> {
  const wishlist = await getWishlist(wishlistId);
  wishlist.items = wishlist.items.filter(
    (item) => item.productId !== productId,
  );
  return saveWishlist(wishlist);
}

/** Join wishlist items with product data for the UI. */
export async function buildWishlistLines(
  wishlist: Wishlist,
): Promise<WishlistLine[]> {
  const lines: WishlistLine[] = [];

  for (const item of wishlist.items) {
    const product = await getProductById(item.productId);
    if (!product) continue;
    lines.push({ product, addedAt: item.addedAt });
  }

  return lines;
}
