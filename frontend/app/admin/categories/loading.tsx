import TableSkeleton from "../../../components/admin/TableSkeleton";

/**
 * Shown automatically while the category page loads its data on the server.
 * The column count matches the real table so the layout doesn't jump.
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <TableSkeleton columns={4} rows={6} />
    </div>
  );
}
