/**
 * Grey placeholder rows shown while table data is loading.
 *
 * `animate-pulse` is the Tailwind class that fades the blocks in and out, which
 * signals "content is coming" instead of showing an empty screen.
 */
export default function TableSkeleton({
  columns = 4,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Array.from({ length: n }) builds an array of n items so we can map
          over it. The value is unused, so we name it `_`. */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 border-b border-zinc-100 px-4 py-4 last:border-0 dark:border-zinc-800"
        >
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <div
              key={columnIndex}
              className="h-4 flex-1 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
