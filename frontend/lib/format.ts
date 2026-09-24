/**
 * Formats a number as USD, e.g. 13999.99 -> "$13,999.99".
 *
 * We use Intl.NumberFormat instead of `"$" + price.toFixed(2)` so larger
 * prices get thousands separators and the currency symbol is handled for us.
 * One shared formatter keeps prices identical everywhere in the UI.
 */
const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatPrice(amount: number): string {
  return formatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Formats an ISO timestamp, e.g. "2026-09-24T18:05:00Z" -> "Sep 24, 2026, 10:05 PM".
 * Missing or malformed values show as a dash instead of "Invalid Date".
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}
