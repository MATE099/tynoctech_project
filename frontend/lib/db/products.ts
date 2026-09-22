import { ScanCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb } from "../dynamodb";
import { Product } from "../../types";

// Table name comes from the environment so we can use different tables
// per environment (dev/prod). Falls back to "Products" for local dev.
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME || "Products";

/**
 * Fetch every product in the table.
 * ScanCommand reads all items. This is fine for a small catalog; for a large
 * one you would add a Global Secondary Index (GSI) and use QueryCommand.
 */
export async function getProducts(): Promise<Product[]> {
  const command = new ScanCommand({ TableName: PRODUCTS_TABLE });
  const response = await dynamodb.send(command);

  // response.Items is typed loosely by the SDK, so we cast to our own type.
  return (response.Items as Product[]) ?? [];
}

/**
 * Fetch a single product by its primary key (id).
 * GetCommand is a direct key lookup: fast and cheap (O(1)).
 * Returns null when nothing is found so callers can show a 404.
 */
export async function getProductById(id: string): Promise<Product | null> {
  const command = new GetCommand({
    TableName: PRODUCTS_TABLE,
    Key: { id },
  });
  const response = await dynamodb.send(command);

  return (response.Item as Product) ?? null;
}

/**
 * Fetch all products that belong to one category.
 * We use a FilterExpression with a placeholder (:catId) instead of string
 * concatenation to avoid injection and to let DynamoDB handle the value safely.
 */
export async function getProductsByCategory(
  categoryId: string,
): Promise<Product[]> {
  const command = new ScanCommand({
    TableName: PRODUCTS_TABLE,
    FilterExpression: "categoryId = :catId",
    ExpressionAttributeValues: {
      ":catId": categoryId,
    },
  });
  const response = await dynamodb.send(command);

  return (response.Items as Product[]) ?? [];
}

/** The fields a caller provides; id and timestamps are generated here. */
export type NewProduct = Omit<Product, "id" | "createdAt" | "updatedAt">;

/**
 * Insert a new product.
 *
 * ConditionExpression makes DynamoDB reject the write if an item with this id
 * already exists. PutCommand would otherwise silently overwrite it.
 */
export async function createProduct(input: NewProduct): Promise<Product> {
  const now = new Date().toISOString();
  const product: Product = {
    ...input,
    id: `prod-${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: PRODUCTS_TABLE,
      Item: product,
      ConditionExpression: "attribute_not_exists(id)",
    }),
  );

  return product;
}
