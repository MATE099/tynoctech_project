import { getProducts, getProductsByCategory } from "../lib/db/products";
import { getCategories } from "../lib/db/categories";
import { Category, Product } from "../types";
import ProductCard from "../components/ProductCard";
import CategoryFilter from "../components/CategoryFilter";

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
  const { category } = await searchParams;
  const activeCategory = typeof category === "string" ? category : undefined;

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

  return (
    <div>
      {/* Hero section */}
      <section className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to TynocStore
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-500">
            Discover quality products at great prices. Browse the catalog below.
          </p>
          <a
            href="#products"
            className="mt-8 inline-block rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Shop now
          </a>
        </div>
      </section>

      {/* Product catalog */}
      <section id="products" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold">Products</h2>
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
            message="Run npm run db:seed to add sample products, or try a different category."
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
