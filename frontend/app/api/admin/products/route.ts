import { NextResponse } from "next/server";
import { getProducts } from "../../../../lib/db/products";
import {
  createProductFromInput,
  filterProducts,
  sortNewestFirst,
} from "../../../../lib/services/products";
import { isStockStatus } from "../../../../lib/stock";

/**
 * Admin products API (JSON).
 *   GET  /api/admin/products?q=watch&status=low_stock -> filtered list
 *   POST /api/admin/products                           -> create a product
 *
 * The admin form uses a Server Action instead; this route exposes the same
 * service logic to API clients and makes the rules easy to test with curl.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;
  const statusParam = searchParams.get("status");
  const status = isStockStatus(statusParam) ? statusParam : undefined;

  try {
    const products = filterProducts(sortNewestFirst(await getProducts()), {
      query,
      status,
    });
    return NextResponse.json({ count: products.length, products });
  } catch (error) {
    console.error("GET /api/admin/products failed:", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  // A malformed body is the client's fault (400), not a server error (500).
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  try {
    const result = await createProductFromInput(body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, fieldErrors: result.fieldErrors },
        { status: 400 },
      );
    }
    return NextResponse.json(result.product, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products failed:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
