import DataTable, { Column } from "../../components/admin/DataTable";
import StatCard from "../../components/admin/StatCard";
import StatCardSkeleton from "../../components/admin/StatCardSkeleton";

/**
 * Admin dashboard home.
 *
 * Day 1 is the SHELL only: the numbers are placeholders and the table uses
 * sample rows. Day 2 replaces these with real DynamoDB counts through an
 * API/server layer, but the components below will not have to change.
 */

const STATS = [
  { label: "Total Users", value: "—" },
  { label: "Total Products", value: "—" },
  { label: "Total Categories", value: "—" },
  { label: "Cart Items", value: "—" },
  { label: "Wishlist Items", value: "—" },
];

// A local type describing the demo rows, so DataTable's generic knows the shape.
type DemoRow = {
  id: string;
  name: string;
  category: string;
  stock: number;
};

const DEMO_ROWS: DemoRow[] = [
  { id: "demo-1", name: "Apple MacBook Pro 14", category: "Laptops", stock: 15 },
  { id: "demo-2", name: "Essence Mascara", category: "Beauty", stock: 99 },
  { id: "demo-3", name: "Rolex Cellini", category: "Men's Watches", stock: 0 },
];

const DEMO_COLUMNS: Column<DemoRow>[] = [
  { header: "Product", accessor: "name" },
  { header: "Category", accessor: "category" },
  {
    header: "Stock",
    // `render` proves a cell can hold custom JSX, not just text.
    render: (row) =>
      row.stock > 0 ? (
        <span className="text-zinc-700 dark:text-zinc-300">{row.stock}</span>
      ) : (
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
          Out of stock
        </span>
      ),
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Overview of store data. Live counts are wired up in the next stage.
        </p>
      </header>

      {/* Stats overview */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STATS.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </section>

      {/* Primitive previews so Day 1 work is visible and testable */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Data table primitive
        </h2>
        <DataTable
          columns={DEMO_COLUMNS}
          rows={DEMO_ROWS}
          emptyMessage="No products yet."
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Loading state primitive
        </h2>
        <StatCardSkeleton count={5} />
        <DataTable<DemoRow> columns={DEMO_COLUMNS} rows={[]} isLoading />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Empty state primitive
        </h2>
        <DataTable<DemoRow>
          columns={DEMO_COLUMNS}
          rows={[]}
          emptyMessage="No records found. Try adjusting your filters."
        />
      </section>
    </div>
  );
}
