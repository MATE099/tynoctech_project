/**
 * Turn a human-readable name into a URL-safe slug.
 *
 *   "Home & Garden"  -> "home-garden"
 *   "Café Supplies"  -> "cafe-supplies"
 *
 * Slugs matter because a category's slug becomes its database key and appears
 * in URLs, so it must be lowercase, predictable and free of spaces.
 */
export function slugify(value: string): string {
  return (
    value
      // NFKD splits an accented letter into "plain letter + accent mark",
      // so "é" becomes "e" once the marks are stripped on the next line.
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      // Any run of characters that isn't a letter or digit becomes one dash.
      .replace(/[^a-z0-9]+/g, "-")
      // A leading or trailing dash would look odd in a URL.
      .replace(/^-+|-+$/g, "")
  );
}
