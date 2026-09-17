"use client";

import { useState } from "react";
import Modal from "./Modal";

/**
 * Temporary Day 1 preview so the Modal shell can be tested before real CRUD
 * screens exist. Delete this file once delete/edit dialogs use <Modal /> directly.
 */
export default function ModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Open sample modal
      </button>

      <Modal
        open={open}
        title="Delete product?"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        This is the confirmation shell that destructive actions will reuse in
        later days. Nothing is deleted yet.
      </Modal>
    </div>
  );
}
