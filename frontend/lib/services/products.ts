import { z } from "zod";
import { PLACEHOLDER_IMAGE_URL } from "../../config/images";
import { getCategoryById } from "../db/categories";
import { createProduct } from "../db/products";
import { getStockStatus, StockStatus } from "../stock";
import { createProductSchema, ProductField } from "../validations/product";
import { Product } from "../../types";

/**
 * Product business logic.
 *
 * Route Handlers and Server Actions are only "transport": they turn an HTTP
 * request or form submission into plain data and call these functions. That
 * way the rules below are written once and apply to every entry point.
 */

export type ProductFieldErrors = Partial<Record<ProductField, string[]>>;

/**
 * A "discriminated union": check `result.ok` and TypeScript knows which of the
 * two shapes you have, so you can't read `product` from a failed result.
 */
export type CreateProductResult =
  | { ok: true; product: Product }
  | { ok: false; message: string; fieldErrors: ProductFieldErrors };

export async function createProductFromInput(
  input: unknown,
): Promise<CreateProductResult> {
  // 1. Shape and format checks.
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      // flattenError groups messages by field: { price: ["..."], ... }
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // 2. Rules that need the database: Zod can check that categoryId is a
  //    non-empty string, but only DynamoDB knows whether that category exists.
  const category = await getCategoryById(parsed.data.categoryId);
  if (!category) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: { categoryId: ["Selected category does not exist"] },
    };
  }

  // 3. Save.
  const product = await createProduct({
    ...parsed.data,
    imageUrl: parsed.data.imageUrl ?? PLACEHOLDER_IMAGE_URL,
  });

  return { ok: true, product };
}

/**
 * Search + status filtering for the admin product list.
 * Done in code because the catalog is small; a large catalog would need a
 * search index instead of scanning every item.
 */
export function filterProducts(
  products: Product[],
  { query, status }: { query?: string; status?: StockStatus },
): Product[] {
  const needle = query?.trim().toLowerCase();

  return products.filter((product) => {
    const matchesQuery =
      !needle ||
      product.name.toLowerCase().includes(needle) ||
      product.description.toLowerCase().includes(needle) ||
      product.id.toLowerCase().includes(needle);

    const matchesStatus = !status || getStockStatus(product.stock) === status;

    return matchesQuery && matchesStatus;
  });
}

/** Newest first, so a product you just created appears at the top. */
export function sortNewestFirst(products: Product[]): Product[] {
  return [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
