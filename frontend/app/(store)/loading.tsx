/**
 * Homepage loading UI.
 * Next.js shows this automatically while the async page component is fetching
 * data on the server. `animate-pulse` gives the classic "skeleton" shimmer.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 h-8 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
          >
            <div className="aspect-square w-full animate-pulse bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
