"use client";

import { useCart } from "./CartProvider";

/**
 * Header cart button. Shows the number of items and opens the drawer.
 */
export default function CartButton() {
  const { summary, openCart } = useCart();
  const count = summary?.itemCount ?? 0;

  return (
    <button
      type="button"
      onClick={openCart}
      className="relative rounded-full px-3 py-1.5 hover:text-blue-600"
      aria-label="Open cart"
    >
      Cart
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
