/**
 * End-to-end test of the dashboard stats and the health check.
 *
 * The counts are only useful if they are exact, so this script changes the
 * data by a known amount (one product, 3 cart units, 1 wishlist item) and
 * checks that every number moves by exactly that much, then back again.
 *
 * Requires `npm run dev` and DynamoDB. Usage:
 *   npm run test:stats                              (http://localhost:3000)
 *   npm run test:stats -- http://localhost:3001     (another port)
 */

import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "../config/tables";
import { dynamodb } from "../lib/dynamodb";
import type { StoreStats } from "../lib/db/stats";
import { call, check, finish, reportCrash, resolveBaseUrl } from "./test-helpers";

const BASE_URL = resolveBaseUrl();
const API = `${BASE_URL}/api`;

async function getStats(): Promise<StoreStats> {
  const response = await call(`${API}/admin/stats`, "GET");
  if (response.status !== 200) throw new Error(`GET /api/admin/stats returned ${response.status}`);
  return response.body;
}

/** Every key whose value differs between two snapshots, e.g. { products: 1 }. */
function diff(before: StoreStats, after: StoreStats) {
  const changes: Partial<Record<keyof StoreStats, number>> = {};
  for (const key of Object.keys(before) as (keyof StoreStats)[]) {
    if (after[key] !== before[key]) changes[key] = after[key] - before[key];
  }
  return changes;
}

async function main() {
  console.log(`Dashboard stats test against ${API}\n`);

  const guestId = `guest-stats-${Date.now()}`;
  const as = { Cookie: `tynoc_session=${guestId}` };
  let productId: string | undefined;

  console.log("1. Health check");
  const health = await call(`${API}/health`, "GET");
  check("GET /api/health returns 200", health.status === 200, health);
  check("reports all 5 tables", health.body?.tables?.length === 5, health.body?.tables);
  check(
    "every table is ACTIVE",
    health.body?.tables?.every((t: { status: string }) => t.status === "ACTIVE"),
    health.body?.tables,
  );

  console.log("2. Counts agree with the list APIs");
  const baseline = await getStats();
  const [products, categories, users] = await Promise.all([
    call(`${API}/admin/products`, "GET"),
    call(`${API}/admin/categories`, "GET"),
    call(`${API}/admin/users`, "GET"),
  ]);
  check("products count matches /api/admin/products", baseline.products === products.body?.count, { stats: baseline.products, list: products.body?.count });
  check("categories count matches /api/admin/categories", baseline.categories === categories.body?.count, { stats: baseline.categories, list: categories.body?.count });
  check("users count matches /api/admin/users", baseline.users === users.body?.count, { stats: baseline.users, list: users.body?.count });

  try {
    console.log("3. Creating a product adds exactly 1 product");
    const categoryId = products.body?.products?.[0]?.categoryId;
    if (!categoryId) throw new Error("Need at least one product. Run `npm run db:seed` first.");
    const created = await call(`${API}/admin/products`, "POST", {
      name: `Stats Test ${Date.now()}`,
      description: "Temporary product created by the stats test.",
      price: 10,
      stock: 5,
      categoryId,
    });
    check("create a temporary product", created.status === 201, created);
    productId = created.body?.id;
    const afterProduct = await getStats();
    check("only products changed, by +1", JSON.stringify(diff(baseline, afterProduct)) === JSON.stringify({ products: 1 }), diff(baseline, afterProduct));

    console.log("4. A guest cart with 3 units and a wishlist item");
    const added = await call(`${API}/cart`, "POST", { productId, quantity: 3 }, as);
    check("add 3 units to a guest cart", added.status === 200, added);
    const wished = await call(`${API}/wishlist`, "POST", { productId }, as);
    check("save the product to a guest wishlist", wished.status === 200, wished);
    const afterCart = await getStats();
    check(
      "carts +1, cartItems +3, wishlists +1, wishlistItems +1",
      JSON.stringify(diff(afterProduct, afterCart)) ===
        JSON.stringify({ carts: 1, cartItems: 3, wishlists: 1, wishlistItems: 1 }),
      diff(afterProduct, afterCart),
    );

    console.log("5. The dashboard page renders the live data");
    const page = await fetch(`${BASE_URL}/admin`);
    const html = await page.text();
    check("GET /admin returns 200", page.status === 200, page.status);
    check("page shows the store totals and system health", html.includes("Store totals") && html.includes("System health"));
    check("page shows the Operational badge", html.includes("Operational"));
  } finally {
    console.log("6. Cleanup returns every count to the baseline");
    if (productId) {
      await call(`${API}/admin/products/${encodeURIComponent(productId)}`, "DELETE");
    }
    await dynamodb.send(new DeleteCommand({ TableName: TABLES.carts, Key: { id: guestId } }));
    await dynamodb.send(new DeleteCommand({ TableName: TABLES.wishlists, Key: { id: guestId } }));
  }

  const final = await getStats();
  check("all counts are back to the baseline", JSON.stringify(diff(baseline, final)) === "{}", diff(baseline, final));

  finish();
}

main().catch((error) => reportCrash(BASE_URL, error));
