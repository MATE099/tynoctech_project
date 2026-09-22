import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DeleteProductButton from "../../../../../components/admin/DeleteProductButton";
import ErrorState from "../../../../../components/admin/ErrorState";
import ProductForm from "../../../../../components/admin/ProductForm";
import { getCategories } from "../../../../../lib/db/categories";
import { getProductById } from "../../../../../lib/db/products";
import { Category, Product } from "../../../../../types";
import { updateProductAction } from "../../actions";

export const metadata: Metadata = { title: "Edit product" };

/**
 * Edit-product page (route: /admin/products/:id/edit).
 * Reading `params` makes this page render on every request, so the form is
 * always filled with the current data from DynamoDB.
 */
export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;

  let product: Product | null = null;
  let categories: Category[] = [];
  let loadError = false;

  try {
    [product, categories] = await Promise.all([
      getProductById(id),
      getCategories(),
    ]);
    categories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error(`Failed to load product ${id} for editing:`, error);
    loadError = true;
  }

  // notFound() throws, like redirect(), so it is called outside the try/catch.
  // It renders the nearest not-found.tsx: app/admin/not-found.tsx.
  if (!loadError && !product) notFound();

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
          Edit product
        </h1>
        {product && (
          <p className="mt-1 font-mono text-xs text-zinc-500">
            {product.id} &middot; last updated{" "}
            {new Date(product.updatedAt).toLocaleString("en-US")}
          </p>
        )}
      </div>

      {loadError || !product ? (
        <ErrorState
          title="Could not load this product"
          message="Check that DynamoDB is running, then refresh."
        />
      ) : (
        <>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <ProductForm
              categories={categories}
              // bind() pre-fills the first argument (the id), producing a
              // function with the (state, formData) signature React expects.
              action={updateProductAction.bind(null, product.id)}
              initialValues={{
                name: product.name,
                description: product.description,
                price: String(product.price),
                stock: String(product.stock),
                categoryId: product.categoryId,
                imageUrl: product.imageUrl,
              }}
              submitLabel="Save changes"
              pendingLabel="Saving..."
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/60 dark:bg-zinc-900">
            <div>
              <h2 className="font-medium text-red-700 dark:text-red-400">
                Delete this product
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Removes it from the catalog permanently.
              </p>
            </div>
            <DeleteProductButton
              productId={product.id}
              productName={product.name}
              variant="button"
              redirectTo={`/admin/products?deleted=${encodeURIComponent(product.name)}`}
            />
          </div>
        </>
      )}
    </div>
  );
}
