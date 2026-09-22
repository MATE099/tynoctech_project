/**
 * End-to-end test of the admin category API: create -> read -> reject bad
 * input -> edit -> block deleting a category that products use -> delete.
 *
 * It talks to the running app over HTTP, exactly like the admin UI does.
 * Requires `npm run dev` (or `npm start`) and DynamoDB to be running.
 *
 * Usage:
 *   npm run test:categories                            (http://localhost:3000)
 *   npm run test:categories -- http://localhost:3001   (another port)
 */

import { call, check, finish, reportCrash, resolveBaseUrl } from "./test-helpers";

const BASE_URL = resolveBaseUrl();
const CATEGORIES = `${BASE_URL}/api/admin/categories`;
const PRODUCTS = `${BASE_URL}/api/admin/products`;

async function main() {
  console.log(`Category lifecycle test against ${CATEGORIES}\n`);

  // A unique suffix keeps repeated runs from colliding on the same slug.
  const suffix = Date.now();
  const name = `Lifecycle Cat ${suffix}`;
  let categoryId: string | undefined;
  let productId: string | undefined;

  try {
    console.log("1. Create (slug derived from the name)");
    const created = await call(CATEGORIES, "POST", {
      name,
      description: "Temporary category created by the lifecycle test.",
    });
    check("POST returns 201", created.status === 201, created);
    categoryId = created.body?.id;
    check(
      "slug is derived from the name and used as the id",
      created.body?.slug === `lifecycle-cat-${suffix}` && categoryId === created.body?.slug,
      created.body,
    );
    if (!categoryId) throw new Error("Cannot continue without a category id");
    const path = `${CATEGORIES}/${encodeURIComponent(categoryId)}`;

    console.log("2. Read");
    const read = await call(path, "GET");
    check(
      "GET returns 200 with a product count of 0",
      read.status === 200 && read.body?.name === name && read.body?.productCount === 0,
      read,
    );

    console.log("3. Reject bad input");
    const duplicate = await call(CATEGORIES, "POST", { name, slug: categoryId });
    check(
      "duplicate slug -> 400 with a slug error",
      duplicate.status === 400 && Array.isArray(duplicate.body?.fieldErrors?.slug),
      duplicate,
    );
    const badSlug = await call(CATEGORIES, "POST", { name: "Bad Slug Test", slug: "Not A Slug!" });
    check("invalid slug format -> 400", badSlug.status === 400, badSlug);
    const shortName = await call(CATEGORIES, "POST", { name: "x" });
    check("name shorter than 2 characters -> 400", shortName.status === 400, shortName);
    const emptyPatch = await call(path, "PATCH", {});
    check(
      "empty PATCH -> 400 'at least one field'",
      emptyPatch.status === 400 && /at least one field/i.test(emptyPatch.body?.error),
      emptyPatch,
    );

    console.log("4. The slug cannot be changed");
    const slugPatch = await call(path, "PATCH", { slug: "renamed-slug" });
    check("PATCH { slug } is rejected", slugPatch.status === 400, slugPatch);
    check("the slug is unchanged in the database", (await call(path, "GET")).body?.slug === categoryId);

    console.log("5. Edit name and description");
    const edited = await call(path, "PATCH", {
      name: `${name} (edited)`,
      description: "Edited by the lifecycle test.",
    });
    check(
      "PATCH returns 200 with the new values",
      edited.status === 200 &&
        edited.body?.name === `${name} (edited)` &&
        edited.body?.description === "Edited by the lifecycle test.",
      edited,
    );
    const cleared = await call(path, "PATCH", { description: "" });
    check("the description can be cleared", cleared.status === 200 && cleared.body?.description === "", cleared);

    console.log("6. Dependency check");
    const product = await call(PRODUCTS, "POST", {
      name: `Lifecycle Cat Product ${suffix}`,
      description: "Temporary product that keeps the category in use.",
      price: 9.99,
      stock: 1,
      categoryId,
    });
    check("a product can be created in the new category", product.status === 201, product);
    productId = product.body?.id;

    const blocked = await call(path, "DELETE");
    check("DELETE is blocked with 409 while a product uses it", blocked.status === 409, blocked);
    check("the 409 reports the product count", blocked.body?.productCount === 1, blocked.body);

    const stillThere = await call(path, "GET");
    check("the category still exists", stillThere.status === 200);
    check("its product count is now 1", stillThere.body?.productCount === 1, stillThere.body);

    console.log("7. Delete once the category is empty");
    const removedProduct = await call(`${PRODUCTS}/${encodeURIComponent(productId!)}`, "DELETE");
    check("the product is deleted first", removedProduct.status === 204, removedProduct);
    productId = undefined;

    const deleted = await call(path, "DELETE");
    check("DELETE now returns 204", deleted.status === 204, deleted);
    categoryId = undefined;

    console.log("8. Confirm it's gone");
    check("GET returns 404", (await call(path, "GET")).status === 404);
    check("PATCH returns 404", (await call(path, "PATCH", { name: "Ghost category" })).status === 404);
    check("second DELETE returns 404", (await call(path, "DELETE")).status === 404);
  } finally {
    // If a check threw midway, don't leave test data behind. The product goes
    // first, otherwise its category would refuse to be deleted.
    if (productId) {
      await call(`${PRODUCTS}/${encodeURIComponent(productId)}`, "DELETE").catch(() => {});
      console.log(`\n(cleaned up leftover product ${productId})`);
    }
    if (categoryId) {
      await call(`${CATEGORIES}/${encodeURIComponent(categoryId)}`, "DELETE").catch(() => {});
      console.log(`(cleaned up leftover category ${categoryId})`);
    }
  }

  finish();
}

main().catch((error) => reportCrash(BASE_URL, error));
