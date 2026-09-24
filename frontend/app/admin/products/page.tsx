import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import DataTable, { Column } from "../../../components/admin/DataTable";
import DeleteProductButton from "../../../components/admin/DeleteProductButton";
import EmptyState, {
  emptyActionClass,
  emptySecondaryActionClass,
} from "../../../components/admin/EmptyState";
import ErrorState from "../../../components/admin/ErrorState";
import ProductFilters from "../../../components/admin/ProductFilters";
import StockBadge from "../../../components/admin/StockBadge";
import StockEditor from "../../../components/admin/StockEditor";
import { getCategories } from "../../../lib/db/categories";
import { getProducts } from "../../../lib/db/products";
import { formatPrice } from "../../../lib/format";
import {
  filterProducts,
  sortNewestFirst,
} from "../../../lib/services/products";
import { isStockStatus } from "../../../lib/stock";
import { Category, Product } from "../../../types";

export const metadata: Metadata = { title: "Products" };

/**
 * Admin product list (route: /admin/products).
 *
 * A Server Component: it reads the filters from the URL, loads data straight
 * from the data layer on the server, and sends finished HTML to the browser.
 */
export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  const { q, status, created, updated, deleted } = await searchParams;
  // URL params can be string | string[] | undefined, so narrow them first.
  const query = typeof q === "string" ? q : "";
  const statusFilter = isStockStatus(status) ? status : undefined;
  const createdId = typeof created === "string" ? created : undefined;
  const updatedId = typeof updated === "string" ? updated : undefined;
  const deletedName = typeof deleted === "string" ? deleted : undefined;

  let allProducts: Product[] = [];
  let categories: Category[] = [];
  let loadError = false;

  try {
    [allProducts, categories] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);
  } catch (error) {
    console.error("Failed to load admin products:", error);
    loadError = true;
  }

  const products = filterProducts(sortNewestFirst(allProducts), {
    query,
    status: statusFilter,
  });

  // A Map gives O(1) lookups of a category name by id for each table row.
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  const createdProduct = createdId
    ? allProducts.find((p) => p.id === createdId)
    : undefined;
  const updatedProduct = updatedId
    ? allProducts.find((p) => p.id === updatedId)
    : undefined;

  const notice = createdProduct
    ? { name: createdProduct.name, verb: "created" }
    : updatedProduct
      ? { name: updatedProduct.name, verb: "updated" }
      : deletedName
        ? { name: deletedName, verb: "deleted" }
        : null;

  const columns: Column<Product>[] = [
    {
      header: "Product",
      render: (product) => (
        <div className="flex min-w-56 items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-700">
            <Image
              src={product.imageUrl}
              alt=""
              fill
              sizes="40px"
              className="object-contain p-0.5"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{product.name}</p>
            <p className="truncate font-mono text-xs text-zinc-500">
              {product.id}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      render: (product) =>
        categoryNames.get(product.categoryId) ?? (
          <span className="text-zinc-400">{product.categoryId}</span>
        ),
    },
    {
      header: "Price",
      className: "text-right",
      render: (product) => (
        <span className="tabular-nums">{formatPrice(product.price)}</span>
      ),
    },
    {
      header: "Stock",
      className: "text-right",
      render: (product) => (
        <StockEditor
          productId={product.id}
          productName={product.name}
          initialStock={product.stock}
        />
      ),
    },
    {
      header: "Status",
      render: (product) => <StockBadge stock={product.stock} />,
    },
    {
      header: "Actions",
      className: "text-right",
      render: (product) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/admin/products/${encodeURIComponent(product.id)}/edit`}
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Edit
          </Link>
          <DeleteProductButton
            productId={product.id}
            productName={product.name}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your catalog and stock levels.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Add product
        </Link>
      </div>

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
        >
          Product <strong>{notice.name}</strong> was {notice.verb}.
        </div>
      )}

      <ProductFilters query={query} status={statusFilter} />

      {loadError ? (
        <ErrorState
          title="Could not load products"
          message="Check that DynamoDB is running and your .env.local is configured, then refresh."
        />
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            Showing {products.length} of {allProducts.length} products
          </p>
          <DataTable
            columns={columns}
            rows={products}
            emptyState={
              query || statusFilter ? (
                <EmptyState
                  title="No products match these filters"
                  description="Try a different search term or stock status."
                  action={
                    <Link href="/admin/products" className={emptySecondaryActionClass}>
                      Clear filters
                    </Link>
                  }
                />
              ) : (
                <EmptyState
                  title="No products yet"
                  description="Products you add here appear in the storefront right away. You can also load the demo catalog with npm run db:seed."
                  action={
                    <Link href="/admin/products/new" className={emptyActionClass}>
                      + Add product
                    </Link>
                  }
                />
              )
            }
          />
        </>
      )}
    </div>
  );
}
