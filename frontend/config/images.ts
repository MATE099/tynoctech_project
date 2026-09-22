/**
 * Remote hosts that product images may be loaded from.
 *
 * next/image refuses to render a remote image whose host is not whitelisted in
 * next.config.ts, so admin validation must accept exactly the same hosts.
 * Both places import this list, which keeps them from drifting apart.
 */
export const ALLOWED_IMAGE_HOSTS = ["cdn.dummyjson.com", "placehold.co"];

/** Used when an admin creates a product without an image. */
export const PLACEHOLDER_IMAGE_URL =
  "https://placehold.co/600x600/png?text=No+Image";
