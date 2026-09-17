"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../../components/CartProvider";
import { formatPrice } from "../../../lib/format";

/**
 * Full cart page (route: /cart). Client Component because it reads and mutates
 * the shared cart state through the useCart hook.
 */
export default function CartPage() {
  const { summary, loading, updateQuantity, removeItem } = useCart();
  const items = summary?.items ?? [];

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-zinc-500">Loading your cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
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
      <h1 className="mb-8 text-2xl font-semibold">Your Cart</h1>

      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {items.map((line) => (
          <li key={line.product.id} className="flex gap-4 py-4">
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
                {formatPrice(line.product.price)} each
              </span>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(line.product.id, line.quantity - 1)
                  }
                  className="h-7 w-7 rounded border border-zinc-300 dark:border-zinc-700"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-8 text-center">{line.quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(line.product.id, line.quantity + 1)
                  }
                  className="h-7 w-7 rounded border border-zinc-300 dark:border-zinc-700"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between">
              <span className="font-semibold">
                {formatPrice(line.lineTotal)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(line.product.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Order summary */}
      <div className="mt-8 flex flex-col items-end gap-4">
        <div className="flex w-full max-w-xs justify-between text-lg font-semibold">
          <span>Subtotal</span>
          <span>{formatPrice(summary?.subtotal ?? 0)}</span>
        </div>
        <button
          type="button"
          className="w-full max-w-xs rounded-full bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
