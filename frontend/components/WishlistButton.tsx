"use client";

import { useState } from "react";
import { useWishlist } from "./WishlistProvider";

/**
 * Heart toggle button. Adds/removes the product from the wishlist.
 */
export default function WishlistButton({ productId }: { productId: string }) {
  const { isInWishlist, toggle } = useWishlist();
  const [pending, setPending] = useState(false);
  const active = isInWishlist(productId);

  async function handleClick() {
    try {
      setPending(true);
      await toggle(productId);
    } catch (error) {
      console.error(error);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={active}
      className={`mt-4 flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
        active
          ? "border-red-500 bg-red-50 text-red-600 dark:bg-red-950/40"
          : "border-zinc-300 text-zinc-700 hover:border-red-500 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-300"
      }`}
    >
      <span aria-hidden>{active ? "♥" : "♡"}</span>
      {active ? "In wishlist" : "Add to wishlist"}
    </button>
  );
}
