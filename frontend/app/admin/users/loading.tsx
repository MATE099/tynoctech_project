import TableSkeleton from "../../../components/admin/TableSkeleton";

/** Shown while the users list (or a user's detail page) loads on the server. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <TableSkeleton columns={7} rows={6} />
    </div>
  );
}
