import Form from "next/form";
import Link from "next/link";
import { STOCK_STATUS_LABELS, StockStatus } from "../../lib/stock";

/**
 * Search box + status filter for the admin product list.
 *
 * It's a GET form, so submitting just changes the URL to
 * /admin/products?q=...&status=... and the page (a Server Component) reads
 * those params. No useState needed, and a filtered view is a shareable link.
 * next/form's <Form> navigates client-side instead of reloading the page.
 */
export default function ProductFilters({
  query,
  status,
}: {
  query: string;
  status?: StockStatus;
}) {
  const hasFilters = Boolean(query || status);

  return (
    <Form
      action="/admin/products"
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <input
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Search by name, description or ID..."
        aria-label="Search products"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 sm:max-w-sm dark:border-zinc-700 dark:bg-zinc-900"
      />

      <select
        name="status"
        defaultValue={status ?? ""}
        aria-label="Filter by stock status"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">All statuses</option>
        {/* Object.entries turns { in_stock: "In stock", ... } into pairs */}
        {Object.entries(STOCK_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Apply
        </button>
        {hasFilters && (
          <Link
            href="/admin/products"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Clear
          </Link>
        )}
      </div>
    </Form>
  );
}
