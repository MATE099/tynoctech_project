import { z } from "zod";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "../db/categories";
import { countProductsByCategory, getProducts } from "../db/products";
import { slugify } from "../slug";
import {
  CategoryField,
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category";
import { Category, Product } from "../../types";

/**
 * Category business logic.
 *
 * The important rule lives here: a category that products still point at
 * cannot be deleted. Keeping it in the service (not in the button) means the
 * API, the UI and any future script all enforce it the same way.
 */

export type CategoryFieldErrors = Partial<Record<CategoryField, string[]>>;

type Invalid = {
  ok: false;
  reason: "invalid";
  message: string;
  fieldErrors: CategoryFieldErrors;
};
type NotFound = { ok: false; reason: "not_found"; message: string };
/** Blocked because other records depend on this one. */
type InUse = {
  ok: false;
  reason: "in_use";
  message: string;
  productCount: number;
};

export type CreateCategoryResult = { ok: true; category: Category } | Invalid;
export type UpdateCategoryResult =
  | { ok: true; category: Category }
  | Invalid
  | NotFound;
export type DeleteCategoryResult = { ok: true } | NotFound | InUse;

/** A category plus how many products currently use it, for the admin table. */
export type CategoryWithCount = Category & { productCount: number };

function invalid(
  fieldErrors: CategoryFieldErrors,
  message = "Please fix the highlighted fields.",
): Invalid {
  return { ok: false, reason: "invalid", message, fieldErrors };
}

/**
 * Fill in a missing slug from the name, so the admin only has to type
 * "Home & Garden" and gets "home-garden" automatically.
 */
function withDerivedSlug(input: unknown): unknown {
  if (typeof input !== "object" || input === null) return input;

  const record = input as Record<string, unknown>;
  const slug = typeof record.slug === "string" ? record.slug.trim() : "";
  if (slug !== "") return input;

  const derived = slugify(typeof record.name === "string" ? record.name : "");
  // If the name has no usable characters, leave the slug empty and let the
  // schema produce a proper "Slug is required" message.
  return derived === "" ? input : { ...record, slug: derived };
}

export async function createCategoryFromInput(
  input: unknown,
): Promise<CreateCategoryResult> {
  const parsed = createCategorySchema.safeParse(withDerivedSlug(input));
  if (!parsed.success) {
    return invalid(z.flattenError(parsed.error).fieldErrors);
  }

  const category = await createCategory({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description ?? "",
  });

  // null means the conditional write failed: that slug is already in use.
  if (!category) {
    return invalid({ slug: ["A category with this slug already exists"] });
  }

  return { ok: true, category };
}

export async function updateCategoryFromInput(
  id: string,
  input: unknown,
): Promise<UpdateCategoryResult> {
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    // formErrors holds object-level messages, e.g. "Provide at least one field".
    return invalid(fieldErrors, formErrors[0]);
  }

  const category = await updateCategory(id, parsed.data);
  if (!category) {
    return { ok: false, reason: "not_found", message: "Category not found" };
  }

  return { ok: true, category };
}

/**
 * Delete a category, but only when no product references it.
 *
 * Relational databases would enforce this with a foreign key. DynamoDB has no
 * such concept, so the check is ours to make: count the products first and
 * refuse when the count is above zero.
 */
export async function deleteCategoryIfUnused(
  id: string,
): Promise<DeleteCategoryResult> {
  const category = await getCategoryById(id);
  if (!category) {
    return { ok: false, reason: "not_found", message: "Category not found" };
  }

  const productCount = await countProductsByCategory(id);
  if (productCount > 0) {
    return {
      ok: false,
      reason: "in_use",
      productCount,
      message: `"${category.name}" still has ${productCount} product${
        productCount === 1 ? "" : "s"
      }. Move or delete them first.`,
    };
  }

  const deleted = await deleteCategory(id);
  if (!deleted) {
    return { ok: false, reason: "not_found", message: "Category not found" };
  }

  return { ok: true };
}

/** Count the products in each category from one already-loaded list. */
export function countProductsPerCategory(
  products: Product[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
  }
  return counts;
}

/**
 * Load every category with its product count, sorted A-Z.
 *
 * One scan of the products table serves all the counts, which is far cheaper
 * than asking DynamoDB for a count per category.
 */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);
  const counts = countProductsPerCategory(products);

  return categories
    .map((category) => ({
      ...category,
      productCount: counts.get(category.id) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Simple name/slug/description search for the admin category list. */
export function filterCategories<T extends Category>(
  categories: T[],
  query?: string,
): T[] {
  const needle = query?.trim().toLowerCase();
  if (!needle) return categories;

  return categories.filter(
    (category) =>
      category.name.toLowerCase().includes(needle) ||
      category.slug.toLowerCase().includes(needle) ||
      (category.description ?? "").toLowerCase().includes(needle),
  );
}
