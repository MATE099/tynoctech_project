import { NextResponse } from "next/server";
import {
  createCategoryFromInput,
  filterCategories,
  getCategoriesWithCounts,
} from "../../../../lib/services/categories";

/**
 * Category collection API.
 *   GET  /api/admin/categories      -> all categories with product counts
 *   POST /api/admin/categories      -> create one
 *
 * These handlers only translate HTTP to and from the service layer; every
 * rule they enforce comes from lib/services/categories.ts.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;

  try {
    const categories = filterCategories(
      await getCategoriesWithCounts(),
      query,
    );
    return NextResponse.json({ count: categories.length, categories });
  } catch (error) {
    console.error("GET /api/admin/categories failed:", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
    const result = await createCategoryFromInput(body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, fieldErrors: result.fieldErrors },
        { status: 400 },
      );
    }
    // 201 Created, with the saved item so the caller learns the generated id.
    return NextResponse.json(result.category, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/categories failed:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
