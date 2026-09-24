import { ScanCommand, type ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { dynamodb } from "../dynamodb";
import { TABLES } from "../../config/tables";

/** The top-level numbers shown on the admin dashboard. */
export type StoreStats = {
  users: number;
  products: number;
  categories: number;
  /** Rows in the Carts table (one per user or guest session). */
  carts: number;
  /** Units across all carts: 2 x mouse + 1 x laptop = 3. */
  cartItems: number;
  wishlists: number;
  /** Saved products across all wishlists. */
  wishlistItems: number;
};

/**
 * Number of rows in a table.
 *
 * `Select: "COUNT"` makes DynamoDB send back only a number, not the items, so
 * the response stays tiny. It still reads the whole table on the server side,
 * and a single Scan stops after 1 MB, so we add up the page counts until
 * `LastEvaluatedKey` is gone.
 */
export async function countItems(tableName: string): Promise<number> {
  let total = 0;
  let startKey: ScanCommandInput["ExclusiveStartKey"];

  do {
    const response = await dynamodb.send(
      new ScanCommand({
        TableName: tableName,
        Select: "COUNT",
        ExclusiveStartKey: startKey,
      }),
    );
    total += response.Count ?? 0;
    startKey = response.LastEvaluatedKey;
  } while (startKey);

  return total;
}

/**
 * Counts the rows of a list-holding table (Carts, Wishlists) AND adds up a
 * number measured on each row's `items` list.
 *
 * `ProjectionExpression` asks DynamoDB for the `items` attribute only, so the
 * ids and timestamps are never downloaded. `#items` is a placeholder because
 * ITEMS is a DynamoDB reserved word.
 */
async function sumOverItems<Item>(
  tableName: string,
  measure: (items: Item[]) => number,
): Promise<{ rows: number; total: number }> {
  let rows = 0;
  let total = 0;
  let startKey: ScanCommandInput["ExclusiveStartKey"];

  do {
    const response = await dynamodb.send(
      new ScanCommand({
        TableName: tableName,
        ProjectionExpression: "#items",
        ExpressionAttributeNames: { "#items": "items" },
        ExclusiveStartKey: startKey,
      }),
    );
    for (const row of response.Items ?? []) {
      rows += 1;
      // `?? []` guards against a malformed row with no items list.
      total += measure((row.items as Item[] | undefined) ?? []);
    }
    startKey = response.LastEvaluatedKey;
  } while (startKey);

  return { rows, total };
}

/** Total units in every cart (the sum of each line's quantity). */
export function sumCartItems() {
  return sumOverItems<{ quantity: number }>(TABLES.carts, (items) =>
    items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
  );
}

/** Total saved products in every wishlist (one entry per product). */
export function sumWishlistItems() {
  return sumOverItems(TABLES.wishlists, (items) => items.length);
}

/**
 * Every dashboard count in one call. The five table reads are independent,
 * so Promise.all runs them at the same time instead of one after another.
 */
export async function getStoreStats(): Promise<StoreStats> {
  const [users, products, categories, carts, wishlists] = await Promise.all([
    countItems(TABLES.users),
    countItems(TABLES.products),
    countItems(TABLES.categories),
    sumCartItems(),
    sumWishlistItems(),
  ]);

  return {
    users,
    products,
    categories,
    carts: carts.rows,
    cartItems: carts.total,
    wishlists: wishlists.rows,
    wishlistItems: wishlists.total,
  };
}
