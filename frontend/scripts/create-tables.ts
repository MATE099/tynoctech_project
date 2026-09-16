import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";

/**
 * Creates the five DynamoDB tables the app needs.
 *
 * Works against DynamoDB Local (set DYNAMODB_ENDPOINT) or real AWS.
 * Safe to run more than once: a table that already exists is skipped.
 */

// The raw client is used here (not the document client) because table
// management is a control-plane operation, not a data operation.
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
});

const tables = [
  process.env.USERS_TABLE_NAME || "Users",
  process.env.PRODUCTS_TABLE_NAME || "Products",
  process.env.CATEGORIES_TABLE_NAME || "Categories",
  process.env.CARTS_TABLE_NAME || "Carts",
  process.env.WISHLISTS_TABLE_NAME || "Wishlists",
];

async function createTable(tableName: string) {
  try {
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
        // Every table uses a single partition key called "id" (String).
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        // On-demand billing: no capacity planning needed.
        BillingMode: "PAY_PER_REQUEST",
      }),
    );
    console.log(`Created table: ${tableName}`);
  } catch (error) {
    // ResourceInUseException means "table already exists" -> not a real error.
    if (error instanceof ResourceInUseException) {
      console.log(`Table already exists, skipping: ${tableName}`);
      return;
    }
    throw error;
  }
}

async function main() {
  console.log(
    `Target: ${process.env.DYNAMODB_ENDPOINT || "real AWS"} (region ${process.env.AWS_REGION})`,
  );

  for (const tableName of tables) {
    await createTable(tableName);
  }

  // Confirm each table is reachable before we report success.
  for (const tableName of tables) {
    const described = await client.send(
      new DescribeTableCommand({ TableName: tableName }),
    );
    console.log(`  ${tableName}: ${described.Table?.TableStatus}`);
  }

  console.log("All tables ready.");
}

main().catch((error) => {
  console.error("Creating tables failed:", error);
  process.exit(1);
});
