import { z } from "zod";

// Adding/removing a wishlist item only needs a product id.
export const addToWishlistSchema = z.object({
  productId: z.string().min(1),
});

export const removeFromWishlistSchema = z.object({
  productId: z.string().min(1),
});

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;
export type RemoveFromWishlistInput = z.infer<typeof removeFromWishlistSchema>;
