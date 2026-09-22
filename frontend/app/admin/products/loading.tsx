import TableSkeleton from "../../../components/admin/TableSkeleton";

/** Shown automatically by Next.js while the products page loads its data. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-10 w-full max-w-xl animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <TableSkeleton columns={6} rows={8} />
    </div>
  );
}
