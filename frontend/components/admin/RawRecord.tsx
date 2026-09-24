/**
 * Collapsible view of a record exactly as DynamoDB stores it.
 *
 * <details>/<summary> is a native HTML disclosure widget: it opens and closes
 * without any JavaScript, so this stays a Server Component.
 */
export default function RawRecord({
  label,
  record,
}: {
  label: string;
  record: unknown;
}) {
  return (
    <details className="rounded-lg border border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer select-none px-4 py-2 font-medium text-zinc-600 dark:text-zinc-300">
        {label}
      </summary>
      <pre className="overflow-x-auto border-t border-zinc-200 px-4 py-3 font-mono text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
        {record === null
          ? "No item stored under this key."
          : JSON.stringify(record, null, 2)}
      </pre>
    </details>
  );
}
