import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION;

if (!region) {
  throw new Error("AWS_REGION is missing from .env.local");
}

// Create one low-level client and reuse it for every DynamoDB operation.
const client = new DynamoDBClient({ region });

// The document client converts normal JavaScript values to DynamoDB values.
export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
