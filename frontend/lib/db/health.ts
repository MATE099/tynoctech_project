import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { client } from "../dynamodb";
import { TABLES } from "../../config/tables";

export type TableHealth = {
  name: string;
  /** "ACTIVE" when usable; "MISSING" when the table was never created. */
  status: string;
  ok: boolean;
  /** Approximate row count. DynamoDB refreshes it about every 6 hours. */
  approxItemCount: number | null;
  error?: string;
};

export type DatabaseHealth = {
  ok: boolean;
  /** Where the app is pointed: the DynamoDB Local URL or "AWS". */
  target: string;
  region: string;
  /** How long the whole check took, in milliseconds. */
  latencyMs: number;
  tables: TableHealth[];
  checkedAt: string;
};

async function checkTable(name: string): Promise<TableHealth> {
  try {
    const { Table } = await client.send(new DescribeTableCommand({ TableName: name }));
    const status = Table?.TableStatus ?? "UNKNOWN";
    return {
      name,
      status,
      ok: status === "ACTIVE",
      approxItemCount: Table?.ItemCount ?? null,
    };
  } catch (error) {
    // Name check instead of instanceof: it also works across SDK copies.
    const missing = error instanceof Error && error.name === "ResourceNotFoundException";
    return {
      name,
      status: missing ? "MISSING" : "UNREACHABLE",
      ok: false,
      approxItemCount: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Checks that every table exists and is ACTIVE.
 *
 * This never throws: a health check must still answer when the database is
 * down, because that is exactly when you need it. Failures are reported per
 * table instead.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const started = performance.now();
  const tables = await Promise.all(Object.values(TABLES).map(checkTable));

  return {
    ok: tables.every((table) => table.ok),
    target: process.env.DYNAMODB_ENDPOINT || "AWS",
    region: process.env.AWS_REGION || "(not set)",
    latencyMs: Math.round(performance.now() - started),
    tables,
    checkedAt: new Date().toISOString(),
  };
}
