import { NextResponse } from "next/server";
import { deleteProduct, getProductById } from "../../../../../lib/db/products";
import { updateProductFromInput } from "../../../../../lib/services/products";

/**
 * Single-product admin API.
 *   GET    /api/admin/products/:id -> the product, or 404
 *   PATCH  /api/admin/products/:id -> change some fields, e.g. { "stock": 4 }
 *   DELETE /api/admin/products/:id -> remove it (204 No Content)
 *
 * `params` is a Promise in Next.js 16, so every handler awaits it.
 */
type Context = RouteContext<"/api/admin/products/[id]">;

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error(`GET /api/admin/products/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to load product" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;

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
    const result = await updateProductFromInput(id, body);
    if (!result.ok) {
      return result.reason === "not_found"
        ? NextResponse.json({ error: result.message }, { status: 404 })
        : NextResponse.json(
            { error: result.message, fieldErrors: result.fieldErrors },
            { status: 400 },
          );
    }
    return NextResponse.json(result.product);
  } catch (error) {
    console.error(`PATCH /api/admin/products/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    const deleted = await deleteProduct(id);
    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    // 204 = success with no response body.
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`DELETE /api/admin/products/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
