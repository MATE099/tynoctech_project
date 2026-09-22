"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProductFromInput } from "../../../lib/services/products";
import type { ProductFieldErrors } from "../../../lib/services/products";
import type { ProductField } from "../../../lib/validations/product";

/**
 * What the form receives back after a failed submission.
 * `values` echoes what the admin typed so the form can refill the inputs.
 */
export type ProductFormState = {
  message?: string;
  fieldErrors?: ProductFieldErrors;
  values?: Partial<Record<ProductField, string>>;
};

const PRODUCT_FIELDS: ProductField[] = [
  "name",
  "description",
  "price",
  "stock",
  "categoryId",
  "imageUrl",
];

/**
 * Server Action behind the "Add product" form.
 *
 * `"use server"` at the top of the file turns every exported async function
 * into an endpoint the browser can call. React passes the previous state and
 * the submitted FormData; whatever we return becomes the form's next state.
 */
export async function createProductAction(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  // FormData.get() returns string | File | null; we only have text fields.
  const values = Object.fromEntries(
    PRODUCT_FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  ) as Record<ProductField, string>;

  let result;
  try {
    result = await createProductFromInput(values);
  } catch (error) {
    console.error("createProductAction failed:", error);
    return {
      message: "Could not save the product. Is the database running?",
      values,
    };
  }

  if (!result.ok) {
    return { message: result.message, fieldErrors: result.fieldErrors, values };
  }

  // Tell Next.js the cached versions of these pages are stale.
  revalidatePath("/admin/products");
  revalidatePath("/");

  // redirect() works by throwing a special error, so it must stay outside the
  // try/catch above or the catch would swallow it.
  redirect(`/admin/products?created=${encodeURIComponent(result.product.id)}`);
}
