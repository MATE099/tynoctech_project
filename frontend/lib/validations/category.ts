import { z } from "zod";

/**
 * Validation rules for creating and updating categories.
 *
 * Same idea as the product schemas: one set of rules shared by the admin UI
 * and the JSON API, so a request can never skip a check by using a different
 * entry point.
 */

// Lowercase letters/digits in groups separated by single dashes:
// "beauty" and "home-garden" pass; "Beauty", "home--garden" and "-x" fail.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCategorySchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be 60 characters or fewer"),

  slug: z
    .string({ error: "Slug is required" })
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(60, "Slug must be 60 characters or fewer")
    .regex(
      SLUG_PATTERN,
      "Slug can only use lowercase letters, numbers and single dashes",
    ),

  // Optional, and an empty string is allowed so the field can be cleared.
  description: z
    .string()
    .trim()
    .max(300, "Description must be 300 characters or fewer")
    .optional(),
});

/**
 * Updates change only the fields that are present, and the slug is not one of
 * them: it is the item's key in DynamoDB and every product stores it as
 * `categoryId`, so renaming it would orphan those products.
 *
 * .omit() drops the slug rule, .partial() makes the rest optional, and the
 * refine rejects an update that would change nothing at all.
 */
export const updateCategorySchema = createCategorySchema
  .omit({ slug: true })
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: "Provide at least one field to update",
  });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

/** Names of the category form fields: "name" | "slug" | "description". */
export type CategoryField = keyof CreateCategoryInput;
