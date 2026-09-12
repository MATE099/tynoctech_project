import Link from "next/link";
import Image from "next/image";
import { Product } from "../types";

/**
 * A single product tile used in the catalog grid.
 * The whole card is a link to the product detail page.
 */
export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-medium">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-zinc-500">
          {product.description}
        </p>
        <p className="mt-2 text-lg font-semibold">
          ${product.price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
