import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductById } from "../../../lib/db/products";

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
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Product info */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="mt-4 text-2xl font-semibold">
            ${product.price.toFixed(2)}
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

          <button
            type="button"
            disabled={!inStock}
            className="mt-8 w-full rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700 sm:w-auto"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
