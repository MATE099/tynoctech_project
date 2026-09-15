"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { Product } from "../types";

/**
 * "Add to cart" button for the product detail page.
 * A Client Component because it responds to clicks and shows a pending state.
 */
export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [pending, setPending] = useState(false);
  const inStock = product.stock > 0;

  async function handleClick() {
    try {
      setPending(true);
      await addItem(product.id, 1);
    } catch (error) {
      console.error(error);
      alert("Sorry, we couldn't add that to your cart.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={!inStock || pending}
      onClick={handleClick}
      className="mt-8 w-full rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700 sm:w-auto"
    >
      {pending ? "Adding..." : inStock ? "Add to cart" : "Out of stock"}
    </button>
  );
}
