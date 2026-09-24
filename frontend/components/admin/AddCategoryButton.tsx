"use client";

import { useState } from "react";
import CategoryFormModal from "./CategoryFormModal";

/**
 * "Add category" button plus the dialog it opens.
 *
 * The modal is rendered only while `open` is true. Mounting it fresh each
 * time is what clears the fields between one category and the next.
 */
export default function AddCategoryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        + Add category
      </button>

      {open && <CategoryFormModal onClose={() => setOpen(false)} />}
    </>
  );
}
