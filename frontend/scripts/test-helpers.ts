/**
 * Shared helpers for the terminal test scripts.
 *
 * Having them in their own file does two things: the lifecycle scripts stay
 * focused on what they are testing, and because this file uses `export`, each
 * script counts as a module with its own scope instead of a global one.
 */

/** Base URL from the command line, then the environment, then the default. */
export function resolveBaseUrl(): string {
  const raw =
    process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
  // Drop a trailing slash so `${base}/api/...` never doubles up.
  return raw.replace(/\/$/, "");
}

let passed = 0;
let failed = 0;

/** Record one assertion and print it. `details` is shown only on failure. */
export function check(label: string, condition: boolean, details?: unknown) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}`);
    if (details !== undefined) {
      console.log("        got:", JSON.stringify(details));
    }
  }
}

/**
 * The admin login from .env.local as a Basic auth header, so the scripts can
 * reach /api/admin/*. Empty when no admin password is configured.
 */
export function adminAuthHeaders(): Record<string, string> {
  const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) return {};
  const token = Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

/**
 * Send a JSON request and return the status plus the parsed body.
 * `headers` is for extras such as a Cookie that picks whose cart to use.
 * The admin login is added automatically; pass `auth: false` to leave it out.
 */
export async function call(
  url: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
  { auth = true }: { auth?: boolean } = {},
) {
  const allHeaders = { ...(auth ? adminAuthHeaders() : {}), ...headers };
  const response = await fetch(url, {
    method,
    headers:
      body === undefined
        ? allHeaders
        : { "Content-Type": "application/json", ...allHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // A 204 has no body, and an error page may be plain text, so parse carefully.
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { text };
  }
  return { status: response.status, body: parsed };
}

/**
 * Print the totals and exit. A non-zero exit code is how a shell script or a
 * CI pipeline learns that the run failed.
 */
export function finish(): never {
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

/** Shared catch handler: turns a refused connection into a useful message. */
export function reportCrash(baseUrl: string, error: unknown): never {
  const unreachable =
    error instanceof TypeError && /fetch failed/i.test(error.message);

  if (unreachable) {
    console.error(
      `\nCould not reach ${baseUrl}. Is "npm run dev" running on that port?`,
    );
  } else {
    console.error("\nTest run crashed:", error);
  }

  process.exit(1);
}
