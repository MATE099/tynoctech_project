"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CartSummary } from "../types";

// Shape of everything the cart context exposes to the rest of the app.
interface CartContextValue {
  summary: CartSummary | null;
  loading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

const EMPTY_SUMMARY: CartSummary = { items: [], subtotal: 0, itemCount: 0 };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Load the cart once when the app mounts. The state updates happen AFTER the
  // awaited fetch (not synchronously), and the `active` flag prevents updating
  // state if the component unmounted mid-request.
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/cart");
        if (!res.ok) throw new Error("Failed to load cart");
        const data = await res.json();
        if (active) setSummary(data);
      } catch (error) {
        console.error(error);
        if (active) setSummary(EMPTY_SUMMARY);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Small helper so every mutation shares the same fetch + state update logic.
  const mutate = useCallback(
    async (method: "POST" | "PATCH" | "DELETE", body: object) => {
      const res = await fetch("/api/cart", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        // Surface the server's message (e.g. "Not enough stock available").
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Cart request failed");
      }
      // The API returns the fresh summary, so we just store it.
      setSummary(await res.json());
    },
    [],
  );

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      await mutate("POST", { productId, quantity });
      setIsOpen(true); // open the drawer so the user sees the result
    },
    [mutate],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) =>
      mutate("PATCH", { productId, quantity }),
    [mutate],
  );

  const removeItem = useCallback(
    (productId: string) => mutate("DELETE", { productId }),
    [mutate],
  );

  return (
    <CartContext.Provider
      value={{
        summary,
        loading,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateQuantity,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/** Hook used by any client component that needs the cart. */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside a CartProvider");
  }
  return ctx;
}
