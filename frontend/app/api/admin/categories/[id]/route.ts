import { NextResponse } from "next/server";
import { getCategoryById } from "../../../../../lib/db/categories";
import { countProductsByCategory } from "../../../../../lib/db/products";
import {
  deleteCategoryIfUnused,
  updateCategoryFromInput,
} from "../../../../../lib/services/categories";

/**
 * Single-category admin API.
 *   GET    /api/admin/categories/:id -> the category plus its product count
 *   PATCH  /api/admin/categories/:id -> change name and/or description
 *   DELETE /api/admin/categories/:id -> remove it, unless products still use it
 */
type Context = RouteContext<"/api/admin/categories/[id]">;

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    const category = await getCategoryById(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    const productCount = await countProductsByCategory(id);
    return NextResponse.json({ ...category, productCount });
  } catch (error) {
    console.error(`GET /api/admin/categories/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to load category" },
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
    const result = await updateCategoryFromInput(id, body);
    if (!result.ok) {
      return result.reason === "not_found"
        ? NextResponse.json({ error: result.message }, { status: 404 })
        : NextResponse.json(
            { error: result.message, fieldErrors: result.fieldErrors },
            { status: 400 },
          );
    }
    return NextResponse.json(result.category);
  } catch (error) {
    console.error(`PATCH /api/admin/categories/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    const result = await deleteCategoryIfUnused(id);

    if (!result.ok) {
      // 409 Conflict is the right status for "the request is valid, but the
      // current state of the data won't allow it" - here, linked products.
      return result.reason === "in_use"
        ? NextResponse.json(
            { error: result.message, productCount: result.productCount },
            { status: 409 },
          )
        : NextResponse.json({ error: result.message }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`DELETE /api/admin/categories/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
