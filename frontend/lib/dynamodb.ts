import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// We read the region at module load but deliberately do NOT throw here.
// Throwing at import time would crash `next build` (which evaluates this file
// while collecting page data). If the region/credentials are missing, the AWS
// SDK throws a clear error the first time we actually send a command, and our
// data-fetching code catches it — keeping imports and the build safe.
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  // Optional: point at a local DynamoDB (e.g. DynamoDB Local in Docker) by
  // setting DYNAMODB_ENDPOINT. When unset, the SDK talks to real AWS.
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
});

// One shared document client, reused for every DynamoDB operation.
// The document client converts normal JavaScript values to DynamoDB values.
export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
