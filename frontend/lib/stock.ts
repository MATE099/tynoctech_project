/**
 * Stock status rules, shared by the storefront and the admin dashboard so both
 * agree on what "low stock" means.
 */
export const LOW_STOCK_THRESHOLD = 5;

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

export function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return "out_of_stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

/** Narrows an untrusted value (e.g. a URL param) to a valid StockStatus. */
export function isStockStatus(value: unknown): value is StockStatus {
  // Object.hasOwn, not `in`: `"toString" in obj` is true for every object.
  return typeof value === "string" && Object.hasOwn(STOCK_STATUS_LABELS, value);
}
