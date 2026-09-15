"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { WishlistLine } from "../types";

interface WishlistContextValue {
  items: WishlistLine[];
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistLine[]>([]);
  const [loading, setLoading] = useState(true);

  // Load the wishlist once on mount (state set after the awaited fetch).
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/wishlist");
        if (!res.ok) throw new Error("Failed to load wishlist");
        const data = await res.json();
        if (active) setItems(data.items ?? []);
      } catch (error) {
        console.error(error);
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => items.some((line) => line.product.id === productId),
    [items],
  );

  // One button both adds and removes, depending on current state.
  const toggle = useCallback(
    async (productId: string) => {
      const method = isInWishlist(productId) ? "DELETE" : "POST";
      const res = await fetch("/api/wishlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("Wishlist request failed");
      const data = await res.json();
      setItems(data.items ?? []);
    },
    [isInWishlist],
  );

  return (
    <WishlistContext.Provider value={{ items, loading, isInWishlist, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used inside a WishlistProvider");
  }
  return ctx;
}
