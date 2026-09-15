import { z } from "zod";

// These schemas validate request bodies BEFORE anything reaches DynamoDB.
// Keeping them in their own file lets both Route Handlers and Server Actions
// reuse the exact same rules.

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
});

export const updateCartQuantitySchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0), // 0 means "remove this line"
});

export const removeFromCartSchema = z.object({
  productId: z.string().min(1),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartQuantityInput = z.infer<typeof updateCartQuantitySchema>;
export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>;
