import { getAllCarts, getCartByOwner } from "../db/cart";
import { getProductsByIds } from "../db/products";
import { getUserById, getUsers } from "../db/users";
import { getAllWishlists, getWishlistByOwner } from "../db/wishlist";
import { Cart, Product, User, Wishlist } from "../../types";

/**
 * Read-only views over users, carts and wishlists for the admin.
 *
 * DynamoDB has no JOIN, so the "relationships" are built here in code:
 *   Carts.id / Wishlists.id  -> Users.id (or an anonymous guest session)
 *   items[].productId        -> Products.id
 *
 * Nothing enforces those links in the database, so a cart can point at a
 * product that was deleted. The storefront quietly skips such items; the
 * inspector shows them, because spotting them is exactly its job.
 */

/** Who a cart or wishlist row belongs to. */
export type OwnerType = "user" | "guest";

export type InspectedCartLine = {
  productId: string;
  quantity: number;
  /** null when the product no longer exists. */
  product: Product | null;
  lineTotal: number;
  /** More units are sitting in the cart than the product has in stock. */
  exceedsStock: boolean;
};

export type InspectedWishlistLine = {
  productId: string;
  addedAt: string;
  product: Product | null;
};

export type InspectedCart = {
  lines: InspectedCartLine[];
  units: number;
  subtotal: number;
  /** Items that point at a deleted product. */
  brokenCount: number;
};

export type InspectedWishlist = {
  lines: InspectedWishlistLine[];
  brokenCount: number;
};

/** A user row for the admin list, with a summary of their activity. */
export type UserWithActivity = User & {
  cartUnits: number;
  wishlistCount: number;
  lastActivity: string | null;
};

/** Everything the user detail page shows. */
export type UserOverview = {
  user: User;
  cart: InspectedCart & { raw: Cart | null };
  wishlist: InspectedWishlist & { raw: Wishlist | null };
};

type Owner = { ownerType: OwnerType; ownerName: string | null };

export type CartRecord = InspectedCart &
  Owner & { id: string; updatedAt: string };
export type WishlistRecord = InspectedWishlist &
  Owner & { id: string; updatedAt: string };

/** How one product is referenced across all carts and wishlists. */
export type ProductRelationship = {
  /** The product id; named `id` so it can be a DataTable row. */
  id: string;
  product: Product | null;
  cartCount: number;
  cartUnits: number;
  wishlistCount: number;
};

export type InspectorData = {
  carts: CartRecord[];
  wishlists: WishlistRecord[];
  products: ProductRelationship[];
  stats: {
    carts: number;
    userCarts: number;
    guestCarts: number;
    emptyCarts: number;
    wishlists: number;
    unitsInCarts: number;
    brokenReferences: number;
  };
};

/** Round to cents so 0.1 + 0.2 shows as 0.3, not 0.30000000000000004. */
function toCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function inspectCart(
  cart: Cart | null,
  products: Map<string, Product>,
): InspectedCart {
  const lines = (cart?.items ?? []).map((item) => {
    const product = products.get(item.productId) ?? null;
    return {
      productId: item.productId,
      quantity: item.quantity,
      product,
      lineTotal: product ? toCents(product.price * item.quantity) : 0,
      exceedsStock: product ? item.quantity > product.stock : false,
    };
  });

  return {
    lines,
    units: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: toCents(lines.reduce((sum, line) => sum + line.lineTotal, 0)),
    brokenCount: lines.filter((line) => !line.product).length,
  };
}

function inspectWishlist(
  wishlist: Wishlist | null,
  products: Map<string, Product>,
): InspectedWishlist {
  const lines = (wishlist?.items ?? []).map((item) => ({
    productId: item.productId,
    addedAt: item.addedAt,
    product: products.get(item.productId) ?? null,
  }));

  return { lines, brokenCount: lines.filter((line) => !line.product).length };
}

/** Every product id referenced by a set of carts and wishlists. */
function referencedProductIds(carts: Cart[], wishlists: Wishlist[]): string[] {
  return [
    ...carts.flatMap((cart) => cart.items.map((item) => item.productId)),
    ...wishlists.flatMap((list) => list.items.map((item) => item.productId)),
  ];
}

/** The later of two ISO timestamps; ISO strings sort correctly as text. */
function latest(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

/**
 * All users with cart/wishlist activity, newest first.
 *
 * Three scans in parallel, then Maps for O(1) lookups, instead of two
 * key lookups per user. For a list page that is far fewer requests.
 */
export async function getUsersWithActivity(): Promise<UserWithActivity[]> {
  const [users, carts, wishlists] = await Promise.all([
    getUsers(),
    getAllCarts(),
    getAllWishlists(),
  ]);

  const cartsByOwner = new Map(carts.map((cart) => [cart.id, cart]));
  const wishlistsByOwner = new Map(wishlists.map((list) => [list.id, list]));

  return users
    .map((user) => {
      const cart = cartsByOwner.get(user.id);
      const wishlist = wishlistsByOwner.get(user.id);
      return {
        ...user,
        cartUnits: (cart?.items ?? []).reduce(
          (sum, item) => sum + item.quantity,
          0,
        ),
        wishlistCount: wishlist?.items.length ?? 0,
        lastActivity: latest(
          cart?.updatedAt ?? null,
          wishlist?.updatedAt ?? null,
        ),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Search users by name, email or id. */
export function filterUsers<T extends User>(users: T[], query?: string): T[] {
  const needle = query?.trim().toLowerCase();
  if (!needle) return users;

  return users.filter(
    (user) =>
      user.name.toLowerCase().includes(needle) ||
      user.email.toLowerCase().includes(needle) ||
      user.id.toLowerCase().includes(needle),
  );
}

/**
 * One user with their cart and wishlist resolved against the product table.
 * Returns null when the user doesn't exist.
 */
export async function getUserOverview(
  userId: string,
): Promise<UserOverview | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  // Both lookups use the user's id as the table key.
  const [cart, wishlist] = await Promise.all([
    getCartByOwner(userId),
    getWishlistByOwner(userId),
  ]);

  const products = await getProductsByIds(
    referencedProductIds(cart ? [cart] : [], wishlist ? [wishlist] : []),
  );

  return {
    user,
    cart: { ...inspectCart(cart, products), raw: cart },
    wishlist: { ...inspectWishlist(wishlist, products), raw: wishlist },
  };
}

/**
 * Every cart and wishlist with its owner resolved, plus a per-product view of
 * how often each product is referenced.
 */
export async function getInspectorData(): Promise<InspectorData> {
  const [users, carts, wishlists] = await Promise.all([
    getUsers(),
    getAllCarts(),
    getAllWishlists(),
  ]);
  const products = await getProductsByIds(
    referencedProductIds(carts, wishlists),
  );

  const userNames = new Map(users.map((user) => [user.id, user.name]));
  // If the row's id matches a user, it's that user's; otherwise it's a guest
  // session created by the storefront cookie.
  const ownerOf = (id: string): Owner =>
    userNames.has(id)
      ? { ownerType: "user", ownerName: userNames.get(id)! }
      : { ownerType: "guest", ownerName: null };

  const cartRecords: CartRecord[] = carts
    .map((cart) => ({
      id: cart.id,
      updatedAt: cart.updatedAt,
      ...ownerOf(cart.id),
      ...inspectCart(cart, products),
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const wishlistRecords: WishlistRecord[] = wishlists
    .map((wishlist) => ({
      id: wishlist.id,
      updatedAt: wishlist.updatedAt,
      ...ownerOf(wishlist.id),
      ...inspectWishlist(wishlist, products),
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  // Tally each product's appearances across all carts and wishlists.
  const relationships = new Map<string, ProductRelationship>();
  const entryFor = (productId: string) => {
    let entry = relationships.get(productId);
    if (!entry) {
      entry = {
        id: productId,
        product: products.get(productId) ?? null,
        cartCount: 0,
        cartUnits: 0,
        wishlistCount: 0,
      };
      relationships.set(productId, entry);
    }
    return entry;
  };
  for (const cart of carts) {
    for (const item of cart.items) {
      const entry = entryFor(item.productId);
      entry.cartCount++;
      entry.cartUnits += item.quantity;
    }
  }
  for (const wishlist of wishlists) {
    for (const item of wishlist.items) {
      entryFor(item.productId).wishlistCount++;
    }
  }

  const productRelationships = [...relationships.values()].sort(
    (a, b) =>
      b.cartUnits + b.wishlistCount - (a.cartUnits + a.wishlistCount),
  );

  return {
    carts: cartRecords,
    wishlists: wishlistRecords,
    products: productRelationships,
    stats: {
      carts: cartRecords.length,
      userCarts: cartRecords.filter((c) => c.ownerType === "user").length,
      guestCarts: cartRecords.filter((c) => c.ownerType === "guest").length,
      emptyCarts: cartRecords.filter((c) => c.lines.length === 0).length,
      wishlists: wishlistRecords.length,
      unitsInCarts: cartRecords.reduce((sum, c) => sum + c.units, 0),
      brokenReferences:
        cartRecords.reduce((sum, c) => sum + c.brokenCount, 0) +
        wishlistRecords.reduce((sum, w) => sum + w.brokenCount, 0),
    },
  };
}
