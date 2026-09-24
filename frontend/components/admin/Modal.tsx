"use client";

import { ReactNode, useEffect } from "react";

/**
 * Modal shell used for admin dialogs (delete confirmation, add/edit forms).
 *
 * It deliberately contains NO business logic: the parent decides what goes in
 * the body and footer. That is what makes it reusable for every CRUD screen.
 */
export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  // Close on Escape. The cleanup function removes the listener so we don't
  // stack a new one every time the modal opens.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Returning null renders nothing at all when the modal is closed.
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Clicking the backdrop closes the dialog. It's a <button> rather than a
          <div> so keyboard users can reach it too. */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      {/* role/aria-modal tell screen readers this is a dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <h2 id="admin-modal-title" className="text-lg font-semibold">
          {title}
        </h2>

        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
          {children}
        </div>

        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
