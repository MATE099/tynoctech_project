import { z } from "zod";
import { ALLOWED_IMAGE_HOSTS } from "../../config/images";

/**
 * Validation rules for creating and updating products.
 *
 * Input arrives in two shapes: HTML forms send every value as a string
 * ("19.99"), while JSON API clients send real numbers (19.99). The helpers
 * below normalise both so one schema serves the Server Action and the API.
 */

/** Treats a blank string as "not provided". */
function emptyToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

/**
 * Turns numeric strings into numbers but leaves anything else alone.
 *
 * We avoid z.coerce.number() because it converts "" to 0, which would
 * silently save a blank stock field as 0 instead of reporting it as missing.
 */
function toNumber(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? value : parsed;
}

/** A number field whose type error says "required" or "must be a number". */
function numberField(label: string) {
  return z.number({
    error: (issue) =>
      issue.input === undefined
        ? `${label} is required`
        : `${label} must be a number`,
  });
}

// Built from the shared host list: ^(cdn\.dummyjson\.com|placehold\.co)$
const allowedHostPattern = new RegExp(
  `^(${ALLOWED_IMAGE_HOSTS.map((host) => host.replace(/\./g, "\\.")).join("|")})$`,
);

export const createProductSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must be 120 characters or fewer"),

  description: z
    .string({ error: "Description is required" })
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be 2000 characters or fewer"),

  price: z.preprocess(
    toNumber,
    numberField("Price")
      .positive("Price must be greater than 0")
      .max(1_000_000, "Price must be 1,000,000 or less")
      .multipleOf(0.01, "Price can have at most 2 decimal places"),
  ),

  stock: z.preprocess(
    toNumber,
    numberField("Stock")
      .int("Stock must be a whole number")
      .min(0, "Stock cannot be negative")
      .max(100_000, "Stock must be 100,000 or less"),
  ),

  categoryId: z
    .string({ error: "Choose a category" })
    .trim()
    .min(1, "Choose a category"),

  // Optional: the service falls back to a placeholder image when omitted.
  imageUrl: z.preprocess(
    emptyToUndefined,
    z
      .url({
        protocol: /^https$/,
        hostname: allowedHostPattern,
        error: `Image URL must be an https link from ${ALLOWED_IMAGE_HOSTS.join(" or ")}`,
      })
      .optional(),
  ),
});

/**
 * Updates reuse the same rules, but every field is optional (.partial()) so an
 * admin can change only the stock, only the price, and so on. The refine
 * rejects an update that contains no fields at all.
 */
export const updateProductSchema = createProductSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: "Provide at least one field to update",
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/** Names of the product form fields, e.g. "name" | "price" | ... */
export type ProductField = keyof CreateProductInput;
