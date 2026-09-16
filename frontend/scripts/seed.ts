import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PutCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamodb } from "../lib/dynamodb";
import { Category, Product, User } from "../types";

const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE_NAME || "Categories";
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME || "Products";
const USERS_TABLE = process.env.USERS_TABLE_NAME || "Users";

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
 * Write every item, then delete anything left over from a previous seed.
 *
 * Pruning makes the script IDEMPOTENT: running it twice always leaves the table
 * matching `catalog.json` exactly, instead of accumulating stale rows (for
 * example categories that no longer have any products).
 */
async function seedTable<T extends { id: string }>(
  label: string,
  table: string,
  items: T[],
) {
  console.log(`Seeding ${items.length} ${label}...`);
  for (const item of items) {
    await dynamodb.send(new PutCommand({ TableName: table, Item: item }));
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
  console.log("All sample data seeded successfully!");
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
