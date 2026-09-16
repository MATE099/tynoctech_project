import { NextResponse } from "next/server";
import { createUser, getUsers } from "../../../lib/db/users";
import { createUserSchema } from "../../../lib/validations/user";

/**
 * Users API.
 *   GET  /api/users -> list users
 *   POST /api/users -> create a user { name, email }
 *
 * Demonstrates create + read for the Users entity with Zod validation and
 * duplicate-email prevention.
 */

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({ count: users.length, users });
  } catch (error) {
    console.error("GET /api/users failed:", error);
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 },
    );
  }
}

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
