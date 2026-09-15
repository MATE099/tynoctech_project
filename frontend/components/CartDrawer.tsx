"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";

/**
 * Slide-over cart drawer. Rendered once (in the layout) and shown/hidden based
 * on the cart context's `isOpen` flag.
 */
export default function CartDrawer() {
  const { summary, isOpen, closeCart, updateQuantity, removeItem } = useCart();

  const items = summary?.items ?? [];

  return (
    <>
      {/* Dark backdrop. Clicking it closes the drawer. */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isOpen}
      />

      {/* The panel itself slides in from the right. */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform dark:bg-zinc-900 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Your Cart</h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="mt-8 text-center text-zinc-500">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((line) => (
                <li key={line.product.id} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={line.product.imageUrl}
                      alt={line.product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">
                      {line.product.name}
                    </span>
                    <span className="text-sm text-zinc-500">
                      ${line.product.price.toFixed(2)}
                    </span>

                    {/* Quantity controls */}
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(line.product.id, line.quantity - 1)
                        }
                        className="h-6 w-6 rounded border border-zinc-300 dark:border-zinc-700"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(line.product.id, line.quantity + 1)
                        }
                        className="h-6 w-6 rounded border border-zinc-300 dark:border-zinc-700"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <span className="text-sm font-semibold">
                      ${line.lineTotal.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(line.product.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with subtotal */}
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3 flex items-center justify-between text-base font-semibold">
            <span>Subtotal</span>
            <span>${(summary?.subtotal ?? 0).toFixed(2)}</span>
          </div>
          <Link
            href="/cart"
            onClick={closeCart}
            className="block rounded-full bg-blue-600 px-6 py-3 text-center font-medium text-white transition hover:bg-blue-700"
          >
            View full cart
          </Link>
        </div>
      </aside>
    </>
  );
}
