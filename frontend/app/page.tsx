import { getProducts, getProductsByCategory } from "../lib/db/products";
import { getCategories } from "../lib/db/categories";
import { Category, Product } from "../types";
import ProductCard from "../components/ProductCard";
import CategoryFilter from "../components/CategoryFilter";
import SearchBar from "../components/SearchBar";

/**
 * Homepage / storefront.
 *
 * This is an async Server Component. Reading `searchParams` opts the page into
 * dynamic rendering, which is what we want because the product list depends on
 * the selected category in the URL (?category=...).
 */
export default async function Home({
  searchParams,
}: PageProps<"/">) {
  // In Next.js 16 `searchParams` is a Promise and must be awaited.
  const { category, q } = await searchParams;
  const activeCategory = typeof category === "string" ? category : undefined;
  const query = typeof q === "string" ? q.trim() : "";

  // Load data from DynamoDB. If credentials/tables aren't ready yet, we degrade
  // gracefully to empty lists instead of crashing the whole page.
  let products: Product[] = [];
  let categories: Category[] = [];
  let loadError = false;

  try {
    [products, categories] = await Promise.all([
      activeCategory ? getProductsByCategory(activeCategory) : getProducts(),
      getCategories(),
    ]);
  } catch (error) {
    console.error("Failed to load storefront data:", error);
    loadError = true;
  }

  // Search filtering happens in code (the catalog is small). We match the query
  // against the product name and description, case-insensitively.
  if (query) {
    const needle = query.toLowerCase();
    products = products.filter(
      (product) =>
        product.name.toLowerCase().includes(needle) ||
        product.description.toLowerCase().includes(needle),
    );
  }

  return (
    <div>
      {/* Hero section */}
      <section className="border-b border-zinc-200 bg-gradient-to-b from-blue-50 via-zinc-50 to-white dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-24">
          <span className="inline-block rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-zinc-900 dark:text-blue-300">
            {products.length > 0
              ? `${products.length} products in stock`
              : "Now open"}
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            Everything you need,{" "}
            <span className="text-blue-600 dark:text-blue-400">
              in one place
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-500">
            Browse {categories.length || "our"} categories of electronics,
            fashion, home goods and more. Free returns within 30 days.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#products"
              className="rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Shop now
            </a>
            <a
              href="#products"
              className="rounded-full border border-zinc-300 px-6 py-3 font-medium transition hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
            >
              Browse categories
            </a>
          </div>
        </div>
      </section>

      {/* Product catalog */}
      <section id="products" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {query ? `Results for "${query}"` : "Products"}
              </h2>
              {!loadError && (
                <p className="mt-1 text-sm text-zinc-500">
                  {products.length}{" "}
                  {products.length === 1 ? "product" : "products"}
                </p>
              )}
            </div>
            <SearchBar defaultQuery={query} />
          </div>
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
          />
        </div>

        {loadError ? (
          <EmptyState
            title="Could not load products"
            message="Check your AWS credentials in .env.local and make sure the DynamoDB tables exist, then run npm run db:seed."
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            message={
              query
                ? "No products match your search. Try different keywords or clear the search."
                : "Run npm run db:seed to add sample products, or try a different category."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** Small reusable placeholder shown when there is nothing to display. */
function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
      <p className="text-lg font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">{message}</p>
    </div>
  );
}
