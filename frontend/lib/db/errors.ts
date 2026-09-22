/**
 * True when DynamoDB refused a write because its ConditionExpression failed.
 *
 * We use conditions to make writes safe:
 *   attribute_not_exists(id) -> "create, but never overwrite"
 *   attribute_exists(id)     -> "update/delete, but never invent a new item"
 *
 * When the condition fails the SDK throws instead of returning a flag, so the
 * data layer catches it here and turns it into a normal null/false result.
 */
export function isConditionFailed(error: unknown): boolean {
  return (
    error instanceof Error && error.name === "ConditionalCheckFailedException"
  );
}
