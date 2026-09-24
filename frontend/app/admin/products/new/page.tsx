import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import ErrorState from "../../../../components/admin/ErrorState";
import ProductForm from "../../../../components/admin/ProductForm";
import { getCategories } from "../../../../lib/db/categories";
import { createProductAction } from "../actions";
import { Category } from "../../../../types";

export const metadata: Metadata = { title: "Add product" };

/**
 * Create-product page (route: /admin/products/new).
 * The server loads the categories for the dropdown; the form itself is a
 * Client Component because it shows validation feedback.
 */
export default async function NewProductPage() {
  // Without this, Next.js sees no request data (no searchParams/cookies) and
  // prerenders the page at build time, freezing the category list forever.
  await connection();

  let categories: Category[] = [];
  let loadError = false;

  try {
    categories = await getCategories();
    categories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to load categories:", error);
    loadError = true;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Back to products
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Add product
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          New products appear in the storefront immediately.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {loadError ? (
          <ErrorState
            title="Could not load categories"
            message="A product needs a category. Check that DynamoDB is running, then refresh."
          />
        ) : (
          <ProductForm
            categories={categories}
            action={createProductAction}
            submitLabel="Create product"
            pendingLabel="Creating..."
          />
        )}
      </div>
    </div>
  );
}
