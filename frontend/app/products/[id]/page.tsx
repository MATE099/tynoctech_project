import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductById, getProductsByCategory } from "../../../lib/db/products";
import AddToCartButton from "../../../components/AddToCartButton";
import WishlistButton from "../../../components/WishlistButton";
import ProductCard from "../../../components/ProductCard";
import { formatPrice } from "../../../lib/format";

/**
 * Dynamic metadata: sets the browser tab title to the product name.
 * `params` is a Promise in Next.js 16, so we await it.
 */
export async function generateMetadata({
  params,
}: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  return {
    title: product ? `${product.name} | TynocStore` : "Product not found",
  };
}

/**
 * Product detail page (route: /products/[id]).
 */
export default async function ProductPage({
  params,
}: PageProps<"/products/[id]">) {
  const { id } = await params;
  const product = await getProductById(id);

  // If there's no product with this id, render the nearest not-found.tsx (404).
  if (!product) {
    notFound();
  }

  const inStock = product.stock > 0;

  // Related products: other items in the same category. We fetch them, drop the
  // current product, and show up to 4. Wrapped in try/catch so a failure here
  // never breaks the main product page.
  let relatedProducts: Awaited<ReturnType<typeof getProductsByCategory>> = [];
  try {
    const sameCategory = await getProductsByCategory(product.categoryId);
    relatedProducts = sameCategory
      .filter((p) => p.id !== product.id)
      .slice(0, 4);
  } catch (error) {
    console.error("Failed to load related products:", error);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link
        href="/#products"
        className="mb-8 inline-block text-sm text-blue-600 hover:underline"
      >
        ← Back to products
      </Link>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Product image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-100">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-6"
            priority
          />
        </div>

        {/* Product info */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="mt-4 text-2xl font-semibold">
            {formatPrice(product.price)}
          </p>

          <span
            className={`mt-3 inline-block w-fit rounded-full px-3 py-1 text-sm font-medium ${
              inStock
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
            }`}
          >
            {inStock ? `In stock (${product.stock})` : "Out of stock"}
          </span>

          <p className="mt-6 leading-relaxed text-zinc-600 dark:text-zinc-300">
            {product.description}
          </p>

          {/* Client Components handle the interactivity; the page stays a
              Server Component that fetches the product. */}
          <AddToCartButton product={product} />
          <WishlistButton productId={product.id} />
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold">Related products</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
