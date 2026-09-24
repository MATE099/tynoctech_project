"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Status = "idle" | "saving" | "saved" | "error";

/**
 * Inline stock input for the product table.
 *
 * Pressing Enter or leaving the field sends PATCH { stock } to the API right
 * away; Escape restores the last saved value. After saving, router.refresh()
 * re-renders the table on the server so the status badge updates too.
 */
export default function StockEditor({
  productId,
  productName,
  initialStock,
}: {
  productId: string;
  productName: string;
  initialStock: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(initialStock));
  const [savedStock, setSavedStock] = useState(initialStock);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // A ref (not state) because it must be read synchronously: Enter followed
  // quickly by a blur must not send the same request twice.
  const inFlight = useRef(false);

  async function save() {
    const next = value.trim();
    if (inFlight.current || next === String(savedStock)) return;

    inFlight.current = true;
    setStatus("saving");
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(productId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // Sent as typed; the server's Zod schema converts and validates it.
          body: JSON.stringify({ stock: next }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.fieldErrors?.stock?.[0] ?? data?.error ?? "Could not update stock",
        );
      }

      setSavedStock(data.stock);
      setValue(String(data.stock));
      setStatus("saved");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not update stock");
    } finally {
      inFlight.current = false;
    }
  }

  function revert() {
    setValue(String(savedStock));
    setStatus("idle");
    setError(null);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {status === "saving" && <span className="text-xs text-zinc-500">Saving...</span>}
        {status === "saved" && (
          <span className="text-xs text-green-600 dark:text-green-400">Saved</span>
        )}
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          aria-label={`Stock for ${productName}`}
          aria-invalid={status === "error"}
          disabled={status === "saving"}
          onChange={(e) => {
            setValue(e.target.value);
            if (status !== "saving") setStatus("idle");
          }}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            } else if (e.key === "Escape") {
              revert();
            }
          }}
          className={`w-20 rounded-md border bg-white px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-blue-600 disabled:opacity-60 dark:bg-zinc-900 ${
            status === "error"
              ? "border-red-500"
              : "border-zinc-300 dark:border-zinc-700"
          }`}
        />
      </div>
      {error && (
        <p role="alert" className="max-w-40 text-right text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
