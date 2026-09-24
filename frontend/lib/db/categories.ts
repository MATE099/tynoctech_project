import {
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamodb } from "../dynamodb";
import { isConditionFailed } from "./errors";
import { Category } from "../../types";
import { TABLES } from "../../config/tables";

const CATEGORIES_TABLE = TABLES.categories;

/**
 * Fetch every category. Used to build the category filter bar on the storefront.
 */
export async function getCategories(): Promise<Category[]> {
  const command = new ScanCommand({ TableName: CATEGORIES_TABLE });
  const response = await dynamodb.send(command);

  return (response.Items as Category[]) ?? [];
}

/** Fetch one category by id, or null if it doesn't exist. */
export async function getCategoryById(id: string): Promise<Category | null> {
  const response = await dynamodb.send(
    new GetCommand({ TableName: CATEGORIES_TABLE, Key: { id } }),
  );

  return (response.Item as Category) ?? null;
}

/** Everything except the id, which is taken from the slug. */
export type NewCategory = Omit<Category, "id">;

/**
 * Insert a new category, using its slug as the primary key.
 *
 * Returns null when the slug is already taken: `attribute_not_exists(id)`
 * makes DynamoDB reject the write instead of overwriting the existing
 * category, which would silently move every product attached to it.
 */
export async function createCategory(
  input: NewCategory,
): Promise<Category | null> {
  const category: Category = { ...input, id: input.slug };

  try {
    await dynamodb.send(
      new PutCommand({
        TableName: CATEGORIES_TABLE,
        Item: category,
        ConditionExpression: "attribute_not_exists(id)",
      }),
    );
    return category;
  } catch (error) {
    if (isConditionFailed(error)) return null;
    throw error;
  }
}

/** The fields an admin may change. The slug/id is fixed once created. */
export type CategoryChanges = Partial<Omit<Category, "id" | "slug">>;

/**
 * Change some fields of an existing category. Returns null if it's not there.
 *
 * Each attribute is referenced through a "#placeholder" because `name` is a
 * reserved word in DynamoDB and would otherwise break the expression.
 */
export async function updateCategory(
  id: string,
  changes: CategoryChanges,
): Promise<Category | null> {
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const assignments: string[] = [];

  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) continue;
    names[`#${key}`] = key;
    values[`:${key}`] = value;
    assignments.push(`#${key} = :${key}`);
  }

  // Nothing to write: report the current item instead of sending an
  // UpdateExpression with an empty SET, which DynamoDB rejects.
  if (assignments.length === 0) return getCategoryById(id);

  try {
    const response = await dynamodb.send(
      new UpdateCommand({
        TableName: CATEGORIES_TABLE,
        Key: { id },
        UpdateExpression: `SET ${assignments.join(", ")}`,
        ConditionExpression: "attribute_exists(id)",
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      }),
    );
    return response.Attributes as Category;
  } catch (error) {
    if (isConditionFailed(error)) return null;
    throw error;
  }
}

/**
 * Delete a category. Returns false if there was nothing to delete.
 *
 * This is the raw write. The "are any products still using it?" rule lives in
 * the service layer, so every caller goes through the same check.
 */
export async function deleteCategory(id: string): Promise<boolean> {
  try {
    await dynamodb.send(
      new DeleteCommand({
        TableName: CATEGORIES_TABLE,
        Key: { id },
        ConditionExpression: "attribute_exists(id)",
      }),
    );
    return true;
  } catch (error) {
    if (isConditionFailed(error)) return false;
    throw error;
  }
}
