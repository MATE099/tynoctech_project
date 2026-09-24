import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Password gate for the admin area, using HTTP Basic authentication.
 *
 * The browser shows its own login prompt and then sends
 * `Authorization: Basic base64(username:password)` with every request, so no
 * login page or session storage is needed. Basic auth sends the password with
 * each request, which is only safe over HTTPS; production must use HTTPS.
 *
 * Credentials come from ADMIN_USERNAME and ADMIN_PASSWORD in .env.local.
 */

export type AdminAuthResult =
  /** Correct credentials, or development with no password configured. */
  | "ok"
  /** No or wrong credentials: answer 401 so the browser asks again. */
  | "unauthorized"
  /** Production with no password set: keep the admin locked (fail closed). */
  | "not_configured";

export const ADMIN_REALM = 'Basic realm="TynocStore Admin", charset="UTF-8"';

/**
 * Compares two strings in constant time. A plain `===` stops at the first
 * wrong character, and that timing difference can leak the password one
 * character at a time. Hashing first makes both buffers the same length,
 * which timingSafeEqual requires.
 */
function safeEqual(a: string, b: string): boolean {
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(a), hash(b));
}

/** "Basic YWRtaW46c2VjcmV0" -> { username: "admin", password: "secret" }. */
function parseBasicAuth(header: string | null) {
  if (!header?.startsWith("Basic ")) return null;
  const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
  // Split at the FIRST colon only: passwords may contain colons, usernames may not.
  const separator = decoded.indexOf(":");
  if (separator === -1) return null;
  return {
    username: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
}

export function checkAdminAuth(authorizationHeader: string | null): AdminAuthResult {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    // Convenient while developing; never acceptable once deployed.
    return process.env.NODE_ENV === "production" ? "not_configured" : "ok";
  }

  const credentials = parseBasicAuth(authorizationHeader);
  if (!credentials) return "unauthorized";

  // Evaluate both comparisons (`&` not `&&`) so a wrong username takes as
  // long as a wrong password.
  const valid =
    Number(safeEqual(credentials.username, username)) &
    Number(safeEqual(credentials.password, password));
  return valid ? "ok" : "unauthorized";
}
