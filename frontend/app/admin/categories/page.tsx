import Form from "next/form";
import Link from "next/link";
import type { Metadata } from "next";
import AddCategoryButton from "../../../components/admin/AddCategoryButton";
import CategoryActions from "../../../components/admin/CategoryActions";
import DataTable, { Column } from "../../../components/admin/DataTable";
import EmptyState, { emptySecondaryActionClass } from "../../../components/admin/EmptyState";
import ErrorState from "../../../components/admin/ErrorState";
import {
  CategoryWithCount,
  filterCategories,
  getCategoriesWithCounts,
} from "../../../lib/services/categories";

export const metadata: Metadata = { title: "Categories" };

/**
 * Admin category list (route: /admin/categories).
 *
 * A Server Component: it loads the data on the server and renders finished
 * HTML. The Add/Edit dialogs and the Delete button are Client Components
 * dropped into the table, so only those small pieces ship JavaScript.
 */
export default async function AdminCategoriesPage({
  searchParams,
}: PageProps<"/admin/categories">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";

  let allCategories: CategoryWithCount[] = [];
  let loadError = false;

  try {
    allCategories = await getCategoriesWithCounts();
  } catch (error) {
    console.error("Failed to load admin categories:", error);
    loadError = true;
  }

  const categories = filterCategories(allCategories, query);
  const linkedCount = allCategories.filter((c) => c.productCount > 0).length;

  const columns: Column<CategoryWithCount>[] = [
    {
      header: "Category",
      render: (category) => (
        <div className="min-w-44">
          <p className="font-medium">{category.name}</p>
          <p className="font-mono text-xs text-zinc-500">{category.slug}</p>
        </div>
      ),
    },
    {
      header: "Description",
      render: (category) =>
        category.description ? (
          <span className="line-clamp-2 max-w-sm text-zinc-600 dark:text-zinc-400">
            {category.description}
          </span>
        ) : (
          <span className="text-zinc-400">&mdash;</span>
        ),
    },
    {
      header: "Products",
      className: "text-right",
      render: (category) =>
        category.productCount > 0 ? (
          <Link
            href={`/?category=${encodeURIComponent(category.id)}#products`}
            className="tabular-nums font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {category.productCount}
          </Link>
        ) : (
          <span className="tabular-nums text-zinc-400">0</span>
        ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (category) => (
        <CategoryActions
          category={category}
          productCount={category.productCount}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Group products for the storefront filter bar.
          </p>
        </div>
        <AddCategoryButton />
      </div>

      {/* A plain GET form: submitting puts ?q=... in the URL, which re-runs
          this Server Component with the new search term. */}
      <Form
        action="/admin/categories"
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by name, slug or description..."
          aria-label="Search categories"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-600 sm:max-w-md dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Search
          </button>
          {query && (
            <Link
              href="/admin/categories"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Clear
            </Link>
          )}
        </div>
      </Form>

      {loadError ? (
        <ErrorState
          title="Could not load categories"
          message="Check that DynamoDB is running and your .env.local is configured, then refresh."
        />
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            Showing {categories.length} of {allCategories.length} categories
            {linkedCount > 0 && (
              <>
                {" "}
                &middot; {linkedCount} cannot be deleted while products use them
              </>
            )}
          </p>
          <DataTable
            columns={columns}
            rows={categories}
            emptyState={
              query ? (
                <EmptyState
                  title="No categories match this search"
                  description={<>Nothing has &ldquo;{query}&rdquo; in its name, slug or description.</>}
                  action={
                    <Link href="/admin/categories" className={emptySecondaryActionClass}>
                      Clear search
                    </Link>
                  }
                />
              ) : (
                <EmptyState
                  title="No categories yet"
                  description="Categories group products into the storefront filter bar. Add one before creating products."
                  action={<AddCategoryButton />}
                />
              )
            }
          />
        </>
      )}
    </div>
  );
}
