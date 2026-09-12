import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProducts, getProductsByCategory } from "../../../lib/db/products";

/**
 * GET /api/products            -> all products
 * GET /api/products?category=X -> products in category X
 *
 * This is a quick way to verify our DAL can read from DynamoDB without
 * building any UI. Visit the URL in the browser or use `curl`.
 */
export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get("category");

    const products = category
      ? await getProductsByCategory(category)
      : await getProducts();

    return NextResponse.json({ count: products.length, products });
  } catch (error) {
    // Surface a clean error instead of crashing the route.
    console.error("Failed to load products:", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 },
    );
  }
}
