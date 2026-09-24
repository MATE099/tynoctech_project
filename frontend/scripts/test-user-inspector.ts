/**
 * End-to-end test of the user management and cart/wishlist inspector APIs.
 *
 * It creates a user, fills their cart and wishlist through the REAL storefront
 * API, then checks that the admin views read that data back correctly: owner
 * resolution, subtotals, guest vs user carts, and deleted-product detection.
 *
 * How it acts "as" a user without a login: the storefront keys carts by the
 * tynoc_session cookie, so sending `tynoc_session=<userId>` stores the cart
 * under the user's id, exactly where a signed-in user's cart will live.
 *
 * Requires `npm run dev` and DynamoDB. Usage:
 *   npm run test:users                              (http://localhost:3000)
 *   npm run test:users -- http://localhost:3001     (another port)
 */

import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "../config/tables";
import { dynamodb } from "../lib/dynamodb";
import { call, check, finish, reportCrash, resolveBaseUrl } from "./test-helpers";

const BASE_URL = resolveBaseUrl();
const API = `${BASE_URL}/api`;

/** Headers that make the storefront API treat us as `ownerId`. */
const as = (ownerId: string) => ({ Cookie: `tynoc_session=${ownerId}` });

/**
 * There is no admin "delete user" endpoint yet, so cleanup removes the test
 * rows straight from DynamoDB. That is why this script loads .env.local.
 */
async function deleteRow(table: string, id: string) {
  await dynamodb.send(new DeleteCommand({ TableName: table, Key: { id } }));
}

async function main() {
  console.log(`User inspector test against ${API}\n`);

  const stamp = Date.now();
  const guestId = `guest-test-${stamp}`;
  let userId: string | undefined;
  let tempProductId: string | undefined;

  // Pick a real product with at least 2 in stock so a quantity of 2 is valid.
  const catalog = await call(`${API}/admin/products`, "GET");
  const product = catalog.body?.products?.find((p: { stock: number }) => p.stock >= 2);
  if (!product) {
    console.error("Need a product with stock >= 2. Run `npm run db:seed` first.");
    process.exit(1);
  }

  try {
    console.log("1. Register a user");
    const name = `Inspector Test ${stamp}`;
    const created = await call(`${API}/users`, "POST", {
      name,
      email: `inspector-${stamp}@example.com`,
    });
    check("POST /api/users returns 201", created.status === 201, created);
    userId = created.body?.id;
    if (!userId) throw new Error("Cannot continue without a user id");
    const overviewUrl = `${API}/admin/users/${encodeURIComponent(userId)}`;

    console.log("2. A new user has no cart or wishlist rows");
    const empty = await call(overviewUrl, "GET");
    check("GET /api/admin/users/:id returns 200", empty.status === 200, empty);
    check("cart row does not exist yet", empty.body?.cart?.raw === null && empty.body?.cart?.lines.length === 0);
    check("wishlist row does not exist yet", empty.body?.wishlist?.raw === null);

    console.log("3. Fill the cart and wishlist through the storefront API");
    const added = await call(`${API}/cart`, "POST", { productId: product.id, quantity: 2 }, as(userId));
    check("add 2 units to the user's cart", added.status === 200, added);
    const wished = await call(`${API}/wishlist`, "POST", { productId: product.id }, as(userId));
    check("add the product to the user's wishlist", wished.status === 200, wished);

    console.log("4. The user overview reads it back from DynamoDB");
    const filled = await call(overviewUrl, "GET");
    const line = filled.body?.cart?.lines?.[0];
    check("cart has 1 line with quantity 2", filled.body?.cart?.lines.length === 1 && line?.quantity === 2, filled.body?.cart);
    check("the line is resolved to the product", line?.product?.id === product.id);
    check(
      "subtotal = price x 2",
      filled.body?.cart?.subtotal === Math.round(product.price * 2 * 100) / 100,
      { subtotal: filled.body?.cart?.subtotal, price: product.price },
    );
    check("raw cart row is keyed by the user id", filled.body?.cart?.raw?.id === userId);
    check("wishlist has the product", filled.body?.wishlist?.lines?.[0]?.product?.id === product.id);

    console.log("5. The user list shows the activity");
    const list = await call(`${API}/admin/users?q=${encodeURIComponent(`inspector-${stamp}`)}`, "GET");
    const row = list.body?.users?.[0];
    check("search finds exactly this user", list.status === 200 && list.body?.count === 1, list.body?.count);
    check("cartUnits = 2 and wishlistCount = 1", row?.cartUnits === 2 && row?.wishlistCount === 1, row);
    check("lastActivity is set", typeof row?.lastActivity === "string");

    console.log("6. A guest cart is labelled as a guest");
    const guest = await call(`${API}/cart`, "POST", { productId: product.id, quantity: 1 }, as(guestId));
    check("add 1 unit to a guest cart", guest.status === 200, guest);

    const inspector = await call(`${API}/admin/inspector`, "GET");
    check("GET /api/admin/inspector returns 200", inspector.status === 200, inspector.status);
    const userCart = inspector.body?.carts?.find((c: { id: string }) => c.id === userId);
    const guestCart = inspector.body?.carts?.find((c: { id: string }) => c.id === guestId);
    check("user's cart is owned by the user, by name", userCart?.ownerType === "user" && userCart?.ownerName === name, userCart);
    check("guest cart is owned by a guest", guestCart?.ownerType === "guest" && guestCart?.ownerName === null, guestCart);
    const relation = inspector.body?.products?.find((p: { id: string }) => p.id === product.id);
    check(
      "product view counts both carts and the wishlist",
      relation?.cartCount >= 2 && relation?.cartUnits >= 3 && relation?.wishlistCount >= 1,
      relation,
    );

    console.log("7. A deleted product shows up as a broken reference");
    const temp = await call(`${API}/admin/products`, "POST", {
      name: `Inspector Temp ${stamp}`,
      description: "Temporary product that will be deleted by the test.",
      price: 5,
      stock: 3,
      categoryId: product.categoryId,
    });
    check("create a temporary product", temp.status === 201, temp);
    tempProductId = temp.body?.id;
    await call(`${API}/wishlist`, "POST", { productId: tempProductId }, as(userId));
    const removed = await call(`${API}/admin/products/${encodeURIComponent(tempProductId!)}`, "DELETE");
    check("delete it while it sits in the wishlist", removed.status === 204, removed);
    tempProductId = undefined;

    const broken = await call(overviewUrl, "GET");
    const orphan = broken.body?.wishlist?.lines?.find((l: { productId: string }) => l.productId === temp.body?.id);
    check("the wishlist item is still listed with product: null", orphan !== undefined && orphan.product === null, orphan);
    check("brokenCount = 1", broken.body?.wishlist?.brokenCount === 1, broken.body?.wishlist?.brokenCount);

    console.log("8. Unknown users");
    const missing = await call(`${API}/admin/users/does-not-exist`, "GET");
    check("GET an unknown user id returns 404", missing.status === 404, missing);
  } finally {
    // Remove every row this run created, even if a check threw midway.
    if (tempProductId) {
      await call(`${API}/admin/products/${encodeURIComponent(tempProductId)}`, "DELETE").catch(() => {});
    }
    if (userId) {
      await deleteRow(TABLES.users, userId);
      await deleteRow(TABLES.carts, userId);
      await deleteRow(TABLES.wishlists, userId);
    }
    await deleteRow(TABLES.carts, guestId);
    console.log("\n(test user, carts and wishlist removed)");
  }

  finish();
}

main().catch((error) => reportCrash(BASE_URL, error));
