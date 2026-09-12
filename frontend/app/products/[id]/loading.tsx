/**
 * Product detail loading UI. Shown while getProductById() runs on the server.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="aspect-square w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />

        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-6 w-1/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-24 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-12 w-40 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
