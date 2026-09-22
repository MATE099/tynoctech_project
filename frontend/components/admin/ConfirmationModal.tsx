"use client";

import { ReactNode } from "react";
import Modal from "./Modal";

/**
 * Reusable "Are you sure?" dialog for destructive actions (delete product,
 * delete category, delete user, ...).
 *
 * It only handles presentation. The parent owns the `open` state and decides
 * what `onConfirm` does, so the same dialog works for any entity.
 */
export default function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  pendingLabel = "Working...",
  tone = "danger",
  isPending = false,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  tone?: "danger" | "default";
  isPending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmClass =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-blue-600 hover:bg-blue-700";

  return (
    <Modal
      open={open}
      title={title}
      // Block closing (Escape/backdrop) while the request is in flight, so the
      // admin can't dismiss the dialog and miss an error.
      onClose={() => {
        if (!isPending) onCancel();
      }}
      footer={
        <>
          {/* autoFocus on Cancel: pressing Enter right away is the SAFE choice */}
          <button
            type="button"
            autoFocus
            disabled={isPending}
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </>
      }
    >
      {description}
      {error && (
        <p role="alert" className="mt-3 font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </Modal>
  );
}
