"use client";

import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "../../components/WishlistProvider";
import { useCart } from "../../components/CartProvider";
import { formatPrice } from "../../lib/format";

/**
 * Wishlist page (route: /wishlist).
 */
export default function WishlistPage() {
  const { items, loading, toggle } = useWishlist();
  const { addItem } = useCart();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-zinc-500">Loading your wishlist...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your wishlist is empty</h1>
        <Link
          href="/#products"
          className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-semibold">Your Wishlist</h1>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((line) => (
          <li
            key={line.product.id}
            className="flex gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800">
              <Image
                src={line.product.imageUrl}
                alt={line.product.name}
                fill
                sizes="96px"
                className="object-contain p-1.5"
              />
            </div>

            <div className="flex flex-1 flex-col">
              <Link
                href={`/products/${line.product.id}`}
                className="font-medium hover:text-blue-600"
              >
                {line.product.name}
              </Link>
              <span className="text-sm text-zinc-500">
                {formatPrice(line.product.price)}
              </span>

              <div className="mt-auto flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => addItem(line.product.id, 1)}
                  className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={() => toggle(line.product.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
