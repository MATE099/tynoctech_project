import { z } from "zod";
import { PLACEHOLDER_IMAGE_URL } from "../../config/images";
import { getCategoryById } from "../db/categories";
import { createProduct, NewProduct, updateProduct } from "../db/products";
import { getStockStatus, StockStatus } from "../stock";
import {
  createProductSchema,
  ProductField,
  updateProductSchema,
} from "../validations/product";
import { Product } from "../../types";

/**
 * Product business logic.
 *
 * Route Handlers and Server Actions are only "transport": they turn an HTTP
 * request or form submission into plain data and call these functions. That
 * way the rules below are written once and apply to every entry point.
 */

export type ProductFieldErrors = Partial<Record<ProductField, string[]>>;

type Invalid = {
  ok: false;
  reason: "invalid";
  message: string;
  fieldErrors: ProductFieldErrors;
};
type NotFound = { ok: false; reason: "not_found"; message: string };

/**
 * "Discriminated unions": check `result.ok` (and `result.reason`) and
 * TypeScript knows which shape you have, so you can't read `product` from a
 * failed result or forget to handle "not found".
 */
export type CreateProductResult = { ok: true; product: Product } | Invalid;
export type UpdateProductResult =
  | { ok: true; product: Product }
  | Invalid
  | NotFound;

function invalid(
  fieldErrors: ProductFieldErrors,
  message = "Please fix the highlighted fields.",
): Invalid {
  return { ok: false, reason: "invalid", message, fieldErrors };
}

/**
 * Zod can check that categoryId is a non-empty string, but only DynamoDB knows
 * whether that category exists. Returns an error result, or null if it's fine.
 */
async function checkCategory(categoryId?: string): Promise<Invalid | null> {
  if (categoryId === undefined) return null;
  const category = await getCategoryById(categoryId);
  return category
    ? null
    : invalid({ categoryId: ["Selected category does not exist"] });
}

async function saveChanges(
  id: string,
  changes: Partial<NewProduct>,
): Promise<UpdateProductResult> {
  const product = await updateProduct(id, changes);
  if (!product) {
    return { ok: false, reason: "not_found", message: "Product not found" };
  }
  return { ok: true, product };
}

export async function createProductFromInput(
  input: unknown,
): Promise<CreateProductResult> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    // flattenError groups messages by field: { price: ["..."], ... }
    return invalid(z.flattenError(parsed.error).fieldErrors);
  }

  const categoryError = await checkCategory(parsed.data.categoryId);
  if (categoryError) return categoryError;

  const product = await createProduct({
    ...parsed.data,
    imageUrl: parsed.data.imageUrl ?? PLACEHOLDER_IMAGE_URL,
  });
  return { ok: true, product };
}

/**
 * PATCH semantics: only the fields present in `input` change.
 * Used by the inline stock editor ({ stock: 4 }) and the admin API.
 */
export async function updateProductFromInput(
  id: string,
  input: unknown,
): Promise<UpdateProductResult> {
  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    // formErrors holds object-level errors, e.g. "Provide at least one field".
    return invalid(fieldErrors, formErrors[0]);
  }

  const categoryError = await checkCategory(parsed.data.categoryId);
  if (categoryError) return categoryError;

  return saveChanges(id, parsed.data);
}

/**
 * Full-replace semantics: every field is required, as on the create form.
 * Used by the edit form, which always submits all fields. An emptied image
 * URL falls back to the placeholder, matching the form's hint text.
 */
export async function replaceProductFromInput(
  id: string,
  input: unknown,
): Promise<UpdateProductResult> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return invalid(z.flattenError(parsed.error).fieldErrors);
  }

  const categoryError = await checkCategory(parsed.data.categoryId);
  if (categoryError) return categoryError;

  return saveChanges(id, {
    ...parsed.data,
    imageUrl: parsed.data.imageUrl ?? PLACEHOLDER_IMAGE_URL,
  });
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
