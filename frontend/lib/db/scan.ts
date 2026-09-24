import { ScanCommand, type ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { dynamodb } from "../dynamodb";

/**
 * Read every item in a table, following DynamoDB's pagination.
 *
 * A single Scan returns at most 1 MB of data, plus a `LastEvaluatedKey` that
 * means "there is more, continue from here". Admin views must see every row,
 * so we keep asking until that key disappears. Without the loop, a big table
 * would be silently cut off.
 */
export async function scanAll<T>(tableName: string): Promise<T[]> {
  const items: T[] = [];
  let startKey: ScanCommandInput["ExclusiveStartKey"];

  do {
    const response = await dynamodb.send(
      new ScanCommand({ TableName: tableName, ExclusiveStartKey: startKey }),
    );
    items.push(...((response.Items as T[]) ?? []));
    startKey = response.LastEvaluatedKey;
  } while (startKey);

  return items;
}
