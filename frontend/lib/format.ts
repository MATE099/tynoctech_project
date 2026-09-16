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
