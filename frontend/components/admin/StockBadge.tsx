import { getStockStatus, STOCK_STATUS_LABELS, StockStatus } from "../../lib/stock";

// Record<StockStatus, string> forces a colour for every status: adding a new
// status without a colour becomes a TypeScript error instead of a blank badge.
const STYLES: Record<StockStatus, string> = {
  in_stock:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  low_stock:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  out_of_stock: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

/** Coloured pill showing a product's stock status. */
export default function StockBadge({ stock }: { stock: number }) {
  const status = getStockStatus(stock);

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {STOCK_STATUS_LABELS[status]}
    </span>
  );
}
