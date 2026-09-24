import StatCardSkeleton from "../../components/admin/StatCardSkeleton";
import TableSkeleton from "../../components/admin/TableSkeleton";

/** Shown instantly while the dashboard's DynamoDB scans run. */
export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <StatCardSkeleton count={5} />
      <div className="grid gap-6 lg:grid-cols-2">
        <TableSkeleton columns={3} rows={5} />
        <TableSkeleton columns={2} rows={5} />
      </div>
    </div>
  );
}
