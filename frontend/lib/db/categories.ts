import { ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb } from "../dynamodb";
import { Category } from "../../types";

const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE_NAME || "Categories";

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
