"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmationModal from "./ConfirmationModal";

/**
 * Delete button + confirmation dialog for one product.
 *
 * On success it either refreshes the current page (list view, the row simply
 * disappears) or navigates to `redirectTo` (edit page, which no longer has a
 * product to show).
 */
export default function DeleteProductButton({
  productId,
  productName,
  redirectTo,
  variant = "link",
}: {
  productId: string;
  productName: string;
  redirectTo?: string;
  variant?: "link" | "button";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(productId)}`,
        { method: "DELETE" },
      );
      // 404 means someone else already deleted it: the goal is reached, so we
      // treat it as success instead of showing a confusing error.
      if (!response.ok && response.status !== 404) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Could not delete the product.");
      }

      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        // Re-runs the Server Component so the table reloads without the row.
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the product.");
    } finally {
      setIsPending(false);
    }
  }

  const triggerClass =
    variant === "button"
      ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
      : "text-sm font-medium text-red-600 hover:underline dark:text-red-400";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={triggerClass}
      >
        Delete
      </button>

      <ConfirmationModal
        open={open}
        title="Delete product?"
        description={
          <>
            <strong>{productName}</strong> will be permanently removed from the
            catalog and disappear from customers&apos; carts and wishlists. This
            cannot be undone.
          </>
        }
        confirmLabel="Delete product"
        pendingLabel="Deleting..."
        isPending={isPending}
        error={error}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
