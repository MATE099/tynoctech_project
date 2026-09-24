import StatCardSkeleton from "../../../components/admin/StatCardSkeleton";
import TableSkeleton from "../../../components/admin/TableSkeleton";

/** Shown while the inspector scans the carts and wishlists on the server. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <StatCardSkeleton count={4} />
      <TableSkeleton columns={6} rows={6} />
    </div>
  );
}
