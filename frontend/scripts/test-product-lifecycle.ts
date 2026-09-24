/**
 * End-to-end test of the admin product API: create -> read -> update stock ->
 * reject bad input -> edit -> search -> delete -> confirm it's gone.
 *
 * It talks to the real running app over HTTP, exactly like the admin UI does.
 * Requires `npm run dev` (or `npm start`) and DynamoDB to be running.
 *
 * Usage:
 *   npm run test:products                              (http://localhost:3000)
 *   npm run test:products -- http://localhost:3001     (another port)
 */

import { call, check, finish, reportCrash, resolveBaseUrl } from "./test-helpers";

const BASE_URL = resolveBaseUrl();
const API = `${BASE_URL}/api/admin/products`;

async function main() {
  console.log(`Product lifecycle test against ${API}\n`);

  // A unique name, so the search step finds exactly this product.
  const name = `Lifecycle Test ${Date.now()}`;
  let id: string | undefined;

  // Borrow a real category from the existing catalog instead of hardcoding one.
  const existing = await call(API, "GET");
  const categoryId: string | undefined = existing.body?.products?.[0]?.categoryId;
  if (!categoryId) {
    console.error("No products found to borrow a category from. Run `npm run db:seed` first.");
    process.exit(1);
  }

  try {
    console.log("1. Create");
    const created = await call(API, "POST", {
      name,
      description: "Temporary product created by the lifecycle test.",
      price: 49.99,
      stock: 12,
      categoryId,
    });
    check("POST returns 201", created.status === 201, created);
    id = created.body?.id;
    check("product has a generated id", typeof id === "string" && id.startsWith("prod-"));
    if (!id) throw new Error("Cannot continue without a product id");
    const path = `${API}/${encodeURIComponent(id)}`;

    console.log("2. Read");
    const read = await call(path, "GET");
    check("GET returns 200 with the same data", read.status === 200 && read.body.name === name && read.body.stock === 12, read);

    console.log("3. Update stock (what the inline editor sends)");
    const stock = await call(path, "PATCH", { stock: "3" });
    check("PATCH { stock } returns 200", stock.status === 200, stock);
    check("stock is now the number 3", stock.body?.stock === 3);
    check("other fields are untouched", stock.body?.name === name && stock.body?.price === 49.99);
    check("updatedAt moved forward", stock.body?.updatedAt > created.body.updatedAt);

    console.log("4. Reject invalid updates");
    const negative = await call(path, "PATCH", { stock: -5 });
    check("negative stock -> 400 with a stock error", negative.status === 400 && Array.isArray(negative.body?.fieldErrors?.stock), negative);
    const fraction = await call(path, "PATCH", { stock: 2.5 });
    check("fractional stock -> 400", fraction.status === 400, fraction);
    const empty = await call(path, "PATCH", {});
    check("empty body -> 400 'at least one field'", empty.status === 400 && /at least one field/i.test(empty.body?.error), empty);
    const badCategory = await call(path, "PATCH", { categoryId: "does-not-exist" });
    check("unknown category -> 400", badCategory.status === 400 && Array.isArray(badCategory.body?.fieldErrors?.categoryId), badCategory);
    const unchanged = await call(path, "GET");
    check("failed updates changed nothing", unchanged.body?.stock === 3);

    console.log("5. Edit several fields");
    const edited = await call(path, "PATCH", { name: `${name} (edited)`, price: 39.5 });
    check("PATCH name + price returns 200", edited.status === 200 && edited.body?.name === `${name} (edited)` && edited.body?.price === 39.5, edited);

    console.log("6. Search sees the change");
    const list = await call(`${API}?q=${encodeURIComponent(`${name} (edited)`)}`, "GET");
    check("list search finds exactly 1 product", list.status === 200 && list.body?.count === 1, list.body?.count);

    console.log("7. Delete");
    const deleted = await call(path, "DELETE");
    check("DELETE returns 204", deleted.status === 204, deleted);

    console.log("8. Confirm it's gone");
    check("GET now returns 404", (await call(path, "GET")).status === 404);
    check("PATCH now returns 404", (await call(path, "PATCH", { stock: 1 })).status === 404);
    check("second DELETE returns 404", (await call(path, "DELETE")).status === 404);
    id = undefined;
  } finally {
    // If a check threw midway, don't leave test data in the catalog.
    if (id) {
      await call(`${API}/${encodeURIComponent(id)}`, "DELETE").catch(() => {});
      console.log(`\n(cleaned up leftover product ${id})`);
    }
  }

  finish();
}

main().catch((error) => reportCrash(BASE_URL, error));
