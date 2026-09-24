import { ScanCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb } from "../dynamodb";
import { scanAll } from "./scan";
import { User } from "../../types";
import { TABLES } from "../../config/tables";

const USERS_TABLE = TABLES.users;

/** Fetch all users, across every page of the table. */
export async function getUsers(): Promise<User[]> {
  return scanAll<User>(USERS_TABLE);
}

/** Fetch one user by id. */
export async function getUserById(id: string): Promise<User | null> {
  const response = await dynamodb.send(
    new GetCommand({ TableName: USERS_TABLE, Key: { id } }),
  );
  return (response.Item as User) ?? null;
}

/** Find a user by email (used to prevent duplicates). */
export async function getUserByEmail(email: string): Promise<User | null> {
  const response = await dynamodb.send(
    new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
    }),
  );
  const items = (response.Items as User[]) ?? [];
  return items[0] ?? null;
}

/**
 * Create a user.
 * Throws if the email is already taken so the API can return a clear 409.
 */
export async function createUser(input: {
  name: string;
  email: string;
}): Promise<User> {
  const existing = await getUserByEmail(input.email);
  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

  const user: User = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    createdAt: new Date().toISOString(),
  };

  await dynamodb.send(new PutCommand({ TableName: USERS_TABLE, Item: user }));
  return user;
}
