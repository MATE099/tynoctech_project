"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CategoryFormModal from "./CategoryFormModal";
import ConfirmationModal from "./ConfirmationModal";
import { Category } from "../../types";

/**
 * Edit and Delete controls for one row of the category table.
 *
 * The dependency rule appears twice on purpose:
 *  - here, to disable Delete and explain why (good UX);
 *  - in the service layer, which is the real guard (good security).
 * A disabled button is only a hint; the server must never rely on it.
 */
export default function CategoryActions({
  category,
  productCount,
}: {
  category: Category;
  productCount: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inUse = productCount > 0;

  async function handleDelete() {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/categories/${encodeURIComponent(category.id)}`,
        { method: "DELETE" },
      );

      // 404 means it is already gone, which is the outcome we wanted anyway.
      if (!response.ok && response.status !== 404) {
        const data = await response.json().catch(() => null);
        // 409 arrives when a product was added while this page was open.
        throw new Error(data?.error ?? "Could not delete the category.");
      }

      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the category.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-4">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        Edit
      </button>

      <button
        type="button"
        disabled={inUse}
        title={
          inUse
            ? `Cannot delete: ${productCount} product${
                productCount === 1 ? "" : "s"
              } still use this category`
            : undefined
        }
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline dark:text-red-400 dark:disabled:text-zinc-600"
      >
        Delete
      </button>

      {editing && (
        <CategoryFormModal
          category={category}
          onClose={() => setEditing(false)}
        />
      )}

      <ConfirmationModal
        open={confirming}
        title="Delete category?"
        description={
          <>
            <strong>{category.name}</strong> will be removed permanently. No
            products are using it, so nothing else changes.
          </>
        }
        confirmLabel="Delete category"
        pendingLabel="Deleting..."
        isPending={isPending}
        error={error}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
