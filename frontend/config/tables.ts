/**
 * DynamoDB table names, overridable per environment in .env.local.
 *
 * Used by the stats and health checks, which need to reach every table.
 */
export const TABLES = {
  users: process.env.USERS_TABLE_NAME || "Users",
  products: process.env.PRODUCTS_TABLE_NAME || "Products",
  categories: process.env.CATEGORIES_TABLE_NAME || "Categories",
  carts: process.env.CARTS_TABLE_NAME || "Carts",
  wishlists: process.env.WISHLISTS_TABLE_NAME || "Wishlists",
} as const;

export type TableKey = keyof typeof TABLES;
