import { NextResponse } from "next/server";
import { createUser } from "../../../lib/db/users";
import { createUserSchema } from "../../../lib/validations/user";

/**
 * Public Users API.
 *   POST /api/users -> create a user { name, email }
 *
 * There is deliberately no public GET: listing users would hand every name
 * and email to anyone on the internet. Admins list users through the
 * password-protected GET /api/admin/users instead.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await createUser(parsed.data);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { error: "A user with that email already exists" },
        { status: 409 },
      );
    }
    console.error("POST /api/users failed:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
