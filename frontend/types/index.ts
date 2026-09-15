export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  updatedAt: string;
}

export interface Wishlist {
  id: string;
  items: WishlistItem[];
  updatedAt: string;
}

// --- "Detail" shapes: raw items enriched with product data for the UI ---

/** One cart row joined with its product plus the computed line total. */
export interface CartLine {
  product: Product;
  quantity: number;
  lineTotal: number;
}

/** Everything the cart UI needs in one object. */
export interface CartSummary {
  items: CartLine[];
  subtotal: number;
  itemCount: number;
}

/** One wishlist row joined with its product. */
export interface WishlistLine {
  product: Product;
  addedAt: string;
}
