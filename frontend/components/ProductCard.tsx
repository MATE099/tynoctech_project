import Link from "next/link";
import Image from "next/image";
import { Product } from "../types";
import { formatPrice } from "../lib/format";

/**
 * A single product tile used in the catalog grid.
 * The whole card is a link to the product detail page.
 */
export default function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white dark:bg-zinc-100">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          // `object-contain` (not cover) because these are product shots on a
          // plain background: we want the whole item visible, never cropped.
          className="object-contain p-4 transition duration-300 group-hover:scale-105"
        />

        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-zinc-900/85 px-2.5 py-1 text-xs font-medium text-white">
            Out of stock
          </span>
        )}
        {lowStock && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-medium text-white">
            Only {product.stock} left
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 border-t border-zinc-100 p-4 dark:border-zinc-800">
        <h3 className="line-clamp-1 font-medium" title={product.name}>
          {product.name}
        </h3>
        <p className="line-clamp-2 text-sm text-zinc-500">
          {product.description}
        </p>
        <p className="mt-2 text-lg font-semibold">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
