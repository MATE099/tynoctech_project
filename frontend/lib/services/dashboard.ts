import { getAllCarts } from "../db/cart";
import { getProducts } from "../db/products";
import { getStoreStats, type StoreStats } from "../db/stats";
import { getUsers } from "../db/users";
import { getAllWishlists } from "../db/wishlist";
import { getStockStatus, type StockStatus } from "../stock";
import type { Product, User } from "../../types";

/** How many rows each dashboard list shows. */
const LIST_LIMIT = 5;

/** A cart or wishlist that changed recently. */
export type ActivityEvent = {
  /** Unique per row, e.g. "cart:user-1" (a user can have both kinds). */
  id: string;
  kind: "cart" | "wishlist";
  ownerId: string;
  /** The user's name, or null for a guest session. */
  ownerName: string | null;
  /** Units for a cart, saved products for a wishlist. */
  itemCount: number;
  updatedAt: string;
};

export type DashboardData = {
  stats: StoreStats;
  stockSummary: Record<StockStatus, number>;
  /** Out-of-stock and low-stock products, lowest stock first. */
  stockAlerts: Product[];
  recentUsers: User[];
  recentActivity: ActivityEvent[];
};

/** Newest first by an ISO timestamp. ISO strings sort correctly as text. */
function newestFirst<T>(rows: T[], dateOf: (row: T) => string): T[] {
  return [...rows].sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
}

/**
 * Everything the dashboard needs, loaded in parallel.
 *
 * The counts come from the cheap COUNT/projection scans in stats.ts. The lists
 * need real rows (names, stock, timestamps), so they read the tables normally.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const [stats, users, products, carts, wishlists] = await Promise.all([
    getStoreStats(),
    getUsers(),
    getProducts(),
    getAllCarts(),
    getAllWishlists(),
  ]);

  const stockSummary: Record<StockStatus, number> = {
    in_stock: 0,
    low_stock: 0,
    out_of_stock: 0,
  };
  for (const product of products) {
    stockSummary[getStockStatus(product.stock)] += 1;
  }

  const stockAlerts = products
    .filter((product) => getStockStatus(product.stock) !== "in_stock")
    .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name))
    .slice(0, LIST_LIMIT);

  // Carts and wishlists are keyed by owner id; this Map turns an id into a name.
  const userNames = new Map(users.map((user) => [user.id, user.name]));

  const events: ActivityEvent[] = [
    ...carts.map((cart) => ({
      id: `cart:${cart.id}`,
      kind: "cart" as const,
      ownerId: cart.id,
      ownerName: userNames.get(cart.id) ?? null,
      itemCount: (cart.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
      updatedAt: cart.updatedAt,
    })),
    ...wishlists.map((wishlist) => ({
      id: `wishlist:${wishlist.id}`,
      kind: "wishlist" as const,
      ownerId: wishlist.id,
      ownerName: userNames.get(wishlist.id) ?? null,
      itemCount: (wishlist.items ?? []).length,
      updatedAt: wishlist.updatedAt,
    })),
  ];

  return {
    stats,
    stockSummary,
    stockAlerts,
    recentUsers: newestFirst(users, (user) => user.createdAt ?? "").slice(0, LIST_LIMIT),
    recentActivity: newestFirst(events, (event) => event.updatedAt ?? "").slice(0, LIST_LIMIT),
  };
}
