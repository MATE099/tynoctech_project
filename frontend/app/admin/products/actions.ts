"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkAdminAuth } from "../../../lib/auth/admin";
import {
  createProductFromInput,
  replaceProductFromInput,
} from "../../../lib/services/products";
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

/** FormData.get() returns string | File | null; we only have text fields. */
function readProductForm(formData: FormData) {
  return Object.fromEntries(
    PRODUCT_FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  ) as Record<ProductField, string>;
}

const SAVE_FAILED = "Could not save the product. Is the database running?";

/**
 * proxy.ts already guards /admin, but a Server Action is an endpoint of its
 * own: if the form ever moves to an unguarded route it would silently lose
 * that protection. Checking here too keeps every write safe on its own.
 */
async function requireAdmin(): Promise<ProductFormState | null> {
  const authorization = (await headers()).get("authorization");
  return checkAdminAuth(authorization) === "ok"
    ? null
    : { message: "You are not signed in as an admin. Reload the page and log in." };
}

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
  const denied = await requireAdmin();
  if (denied) return denied;

  const values = readProductForm(formData);

  let result;
  try {
    result = await createProductFromInput(values);
  } catch (error) {
    console.error("createProductAction failed:", error);
    return { message: SAVE_FAILED, values };
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

/**
 * Server Action behind the "Edit product" form.
 *
 * The edit page pre-fills the first argument with
 * `updateProductAction.bind(null, product.id)`, so React still calls it with
 * (previousState, formData) like any form action.
 */
export async function updateProductAction(
  productId: string,
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const values = readProductForm(formData);

  let result;
  try {
    result = await replaceProductFromInput(productId, values);
  } catch (error) {
    console.error("updateProductAction failed:", error);
    return { message: SAVE_FAILED, values };
  }

  if (!result.ok) {
    return result.reason === "not_found"
      ? { message: "This product no longer exists. It may have been deleted.", values }
      : { message: result.message, fieldErrors: result.fieldErrors, values };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/");

  redirect(`/admin/products?updated=${encodeURIComponent(productId)}`);
}
