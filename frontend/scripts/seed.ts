import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PutCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamodb } from "../lib/dynamodb";
import { Cart, Category, Product, User, Wishlist } from "../types";
import { TABLES } from "../config/tables";

const {
  categories: CATEGORIES_TABLE,
  products: PRODUCTS_TABLE,
  users: USERS_TABLE,
  carts: CARTS_TABLE,
  wishlists: WISHLISTS_TABLE,
} = TABLES;

const now = () => new Date().toISOString();

/**
 * The catalog lives in a separate JSON file so the data is easy to edit or
 * regenerate without touching this script's logic.
 */
type CatalogProduct = Omit<Product, "createdAt" | "updatedAt">;

const catalog = JSON.parse(
  readFileSync(join(import.meta.dirname, "catalog.json"), "utf-8"),
) as { categories: Category[]; products: CatalogProduct[] };

// Add the timestamps our Product type requires.
const products: Product[] = catalog.products.map((product) => ({
  ...product,
  createdAt: now(),
  updatedAt: now(),
}));

const sampleUsers: User[] = [
  {
    id: "user-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    createdAt: now(),
  },
  {
    id: "user-2",
    name: "Alan Turing",
    email: "alan@example.com",
    createdAt: now(),
  },
];

/**
 * Demo carts and wishlists for the sample users, so the admin inspector has
 * user-owned data to show. They are stored under the user's id: the same key
 * a signed-in user's cart will use once authentication exists (guests use
 * their session id instead).
 */
const productAt = (index: number) => products[index % products.length].id;

const sampleCarts: Cart[] = [
  {
    id: "user-1",
    items: [
      { productId: productAt(0), quantity: 2 },
      { productId: productAt(7), quantity: 1 },
    ],
    updatedAt: now(),
  },
  {
    id: "user-2",
    items: [{ productId: productAt(12), quantity: 1 }],
    updatedAt: now(),
  },
];

const sampleWishlists: Wishlist[] = [
  {
    id: "user-1",
    items: [
      { productId: productAt(3), addedAt: now() },
      { productId: productAt(20), addedAt: now() },
    ],
    updatedAt: now(),
  },
  {
    id: "user-2",
    items: [{ productId: productAt(0), addedAt: now() }],
    updatedAt: now(),
  },
];

/**
 * Write every item, then delete anything left over from a previous seed.
 *
 * Pruning makes the script IDEMPOTENT: running it twice always leaves the table
 * matching `catalog.json` exactly, instead of accumulating stale rows (for
 * example categories that no longer have any products).
 *
 * Pass `{ prune: false }` for tables that also hold real visitor data (carts,
 * wishlists), so reseeding never wipes a shopper's guest cart.
 */
async function seedTable<T extends { id: string }>(
  label: string,
  table: string,
  items: T[],
  { prune = true }: { prune?: boolean } = {},
) {
  console.log(`Seeding ${items.length} ${label}...`);
  for (const item of items) {
    await dynamodb.send(new PutCommand({ TableName: table, Item: item }));
  }

  if (!prune) {
    console.log("  done (existing rows kept)");
    return;
  }

  const wantedIds = new Set(items.map((item) => item.id));
  const existing = await dynamodb.send(
    new ScanCommand({ TableName: table, ProjectionExpression: "id" }),
  );

  let removed = 0;
  for (const row of (existing.Items as { id: string }[]) ?? []) {
    if (!wantedIds.has(row.id)) {
      await dynamodb.send(
        new DeleteCommand({ TableName: table, Key: { id: row.id } }),
      );
      removed++;
    }
  }

  console.log(`  done${removed > 0 ? ` (removed ${removed} stale)` : ""}`);
}

async function seed() {
  await seedTable("categories", CATEGORIES_TABLE, catalog.categories);
  await seedTable("products", PRODUCTS_TABLE, products);
  await seedTable("users", USERS_TABLE, sampleUsers);
  await seedTable("demo carts", CARTS_TABLE, sampleCarts, { prune: false });
  await seedTable("demo wishlists", WISHLISTS_TABLE, sampleWishlists, {
    prune: false,
  });
  console.log("All sample data seeded successfully!");
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
