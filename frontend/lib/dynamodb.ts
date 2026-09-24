import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * "localhost" resolves to two addresses (::1 and 127.0.0.1). When DynamoDB
 * Local is down, Node tries both and rejects with an AggregateError. In
 * development React cannot pass that error type to the browser, so a page
 * hangs instead of showing its "Could not load" state. Docker publishes the
 * container on IPv4, so pointing straight at 127.0.0.1 avoids both problems.
 */
function resolveEndpoint(endpoint: string | undefined): string | undefined {
  if (!endpoint) return undefined;
  try {
    const url = new URL(endpoint);
    if (url.hostname === "localhost") url.hostname = "127.0.0.1";
    // URL adds a trailing slash to a bare origin; strip it to keep it tidy.
    return url.toString().replace(/\/$/, "");
  } catch {
    return endpoint;
  }
}

// We read the region at module load but deliberately do NOT throw here.
// Throwing at import time would crash `next build` (which evaluates this file
// while collecting page data). If the region/credentials are missing, the AWS
// SDK throws a clear error the first time we actually send a command, and our
// data-fetching code catches it — keeping imports and the build safe.
//
// `client` is exported for control-plane calls such as DescribeTable (the
// health check); data reads and writes go through `dynamodb` below.
export const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  // Optional: point at a local DynamoDB (e.g. DynamoDB Local in Docker) by
  // setting DYNAMODB_ENDPOINT. When unset, the SDK talks to real AWS.
  endpoint: resolveEndpoint(process.env.DYNAMODB_ENDPOINT),
});

// One shared document client, reused for every DynamoDB operation.
// The document client converts normal JavaScript values to DynamoDB values.
export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
