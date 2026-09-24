import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import Badge from "../../components/admin/Badge";
import DataTable, { Column } from "../../components/admin/DataTable";
import EmptyState, { emptySecondaryActionClass } from "../../components/admin/EmptyState";
import ErrorState from "../../components/admin/ErrorState";
import ProductRef from "../../components/admin/ProductRef";
import StatCard from "../../components/admin/StatCard";
import StockBadge from "../../components/admin/StockBadge";
import { checkDatabaseHealth, type DatabaseHealth } from "../../lib/db/health";
import { formatDate } from "../../lib/format";
import {
  getDashboardData,
  type ActivityEvent,
  type DashboardData,
} from "../../lib/services/dashboard";
import type { StockStatus } from "../../lib/stock";
import type { Product, User } from "../../types";

export const metadata: Metadata = { title: "Dashboard" };

/** "1234" -> "1,234". */
const count = (value: number) => value.toLocaleString("en-US");

/**
 * Admin dashboard (route: /admin).
 *
 * Live store totals, stock and activity summaries, and a database health
 * check, all read from DynamoDB on every request.
 */
export default async function AdminDashboardPage() {
  // This page reads no URL params, so Next.js would otherwise prerender it
  // once at build time and show stale numbers forever. connection() says
  // "render per request". It must stay outside try/catch.
  await connection();

  // The health check never throws, so it can still explain an outage when
  // the data queries fail.
  const [dataResult, health] = await Promise.all([
    getDashboardData().then(
      (data) => ({ data }),
      (error: unknown) => {
        console.error("Failed to load dashboard data:", error);
        return { data: null };
      },
    ),
    checkDatabaseHealth(),
  ]);
  const { data } = dataResult;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Live store data from DynamoDB &middot; updated {formatDate(health.checkedAt)}
        </p>
      </header>

      {data ? (
        <Metrics stats={data.stats} />
      ) : (
        <ErrorState
          title="Could not load store data"
          message="Check the system health panel below, make sure DynamoDB is running, then refresh."
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {data && <StockHealth data={data} />}
        <SystemHealth health={health} />
      </div>

      {data && (
        <div className="grid gap-6 xl:grid-cols-2">
          <RecentUsers users={data.recentUsers} />
          <RecentActivity events={data.recentActivity} />
        </div>
      )}
    </div>
  );
}

/** Wraps a card in a link, so every metric is also a shortcut. */
function MetricLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-xl transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      {children}
    </Link>
  );
}

function Metrics({ stats }: { stats: DashboardData["stats"] }) {
  return (
    <section className="space-y-3">
      <SectionTitle>Store totals</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricLink href="/admin/users">
          <StatCard label="Total Users" value={count(stats.users)} hint="Registered accounts" />
        </MetricLink>
        <MetricLink href="/admin/products">
          <StatCard label="Total Products" value={count(stats.products)} hint="In the catalog" />
        </MetricLink>
        <MetricLink href="/admin/categories">
          <StatCard label="Total Categories" value={count(stats.categories)} hint="Storefront groups" />
        </MetricLink>
        <MetricLink href="/admin/inspector?view=carts">
          <StatCard
            label="Cart Items"
            value={count(stats.cartItems)}
            hint={`Units across ${count(stats.carts)} cart${stats.carts === 1 ? "" : "s"}`}
          />
        </MetricLink>
        <MetricLink href="/admin/inspector?view=wishlists">
          <StatCard
            label="Wishlist Items"
            value={count(stats.wishlistItems)}
            hint={`Saved in ${count(stats.wishlists)} wishlist${stats.wishlists === 1 ? "" : "s"}`}
          />
        </MetricLink>
      </div>
    </section>
  );
}

const STOCK_BARS: { status: StockStatus; label: string; color: string }[] = [
  { status: "in_stock", label: "In stock", color: "bg-green-500" },
  { status: "low_stock", label: "Low stock", color: "bg-amber-500" },
  { status: "out_of_stock", label: "Out of stock", color: "bg-red-500" },
];

function StockHealth({ data }: { data: DashboardData }) {
  const total = data.stats.products;

  const columns: Column<Product>[] = [
    { header: "Product", render: (product) => <ProductRef productId={product.id} product={product} /> },
    {
      header: "Stock",
      className: "text-right",
      render: (product) => <span className="tabular-nums">{product.stock}</span>,
    },
    { header: "Status", render: (product) => <StockBadge stock={product.stock} /> },
  ];

  return (
    <Panel title="Stock health">
      {/* One bar split by share of the catalog; widths are percentages. */}
      <div className="flex h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {total > 0 &&
          STOCK_BARS.map(({ status, color }) => (
            <div
              key={status}
              className={color}
              style={{ width: `${(data.stockSummary[status] / total) * 100}%` }}
            />
          ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {STOCK_BARS.map(({ status, label, color }) => (
          <li key={status} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
            {label}: <span className="font-medium tabular-nums">{count(data.stockSummary[status])}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <DataTable
          columns={columns}
          rows={data.stockAlerts}
          emptyState={
            <EmptyState
              title={total === 0 ? "No products yet" : "All products are well stocked"}
              description={
                total === 0
                  ? "Stock alerts appear here once the catalog has products."
                  : "Products that are low or out of stock will be listed here."
              }
            />
          }
        />
      </div>
    </Panel>
  );
}

function SystemHealth({ health }: { health: DatabaseHealth }) {
  return (
    <Panel
      title="System health"
      aside={<Badge tone={health.ok ? "green" : "red"}>{health.ok ? "Operational" : "Degraded"}</Badge>}
    >
      <dl className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Database</dt>
          <dd className="mt-1 truncate font-mono text-xs" title={health.target}>{health.target}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Region</dt>
          <dd className="mt-1 font-mono text-xs">{health.region}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Response time</dt>
          <dd className="mt-1 tabular-nums">{health.latencyMs} ms</dd>
        </div>
      </dl>

      <ul className="mt-5 divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {health.tables.map((table) => (
          <li key={table.name} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
            <span className="font-medium">{table.name}</span>
            <Badge tone={table.ok ? "green" : "red"}>{table.status}</Badge>
          </li>
        ))}
      </ul>

      {!health.ok && (
        <p className="mt-3 text-sm text-red-700 dark:text-red-400">
          {health.tables.some((t) => t.status === "MISSING")
            ? "Some tables are missing. Run npm run db:create-tables, then npm run db:seed."
            : "DynamoDB is unreachable. Start it with docker start tynoc-dynamodb."}
        </p>
      )}
      <p className="mt-3 text-xs text-zinc-500">
        Monitors can poll <code className="font-mono">/api/health</code>: 200 when healthy, 503 when not.
      </p>
    </Panel>
  );
}

function RecentUsers({ users }: { users: User[] }) {
  const columns: Column<User>[] = [
    {
      header: "User",
      render: (user) => (
        <div className="min-w-40">
          <Link href={`/admin/users/${encodeURIComponent(user.id)}`} className="font-medium hover:underline">
            {user.name}
          </Link>
          <p className="text-xs text-zinc-500">{user.email}</p>
        </div>
      ),
    },
    {
      header: "Joined",
      render: (user) => <span className="whitespace-nowrap">{formatDate(user.createdAt)}</span>,
    },
  ];

  return (
    <Panel
      title="Recent sign-ups"
      aside={<PanelLink href="/admin/users">All users</PanelLink>}
    >
      <DataTable
        columns={columns}
        rows={users}
        emptyState={
          <EmptyState
            title="No users yet"
            description="New accounts appear here as soon as they sign up."
          />
        }
      />
    </Panel>
  );
}

function RecentActivity({ events }: { events: ActivityEvent[] }) {
  const columns: Column<ActivityEvent>[] = [
    {
      header: "Owner",
      render: (event) =>
        event.ownerName ? (
          <Link href={`/admin/users/${encodeURIComponent(event.ownerId)}`} className="font-medium hover:underline">
            {event.ownerName}
          </Link>
        ) : (
          <span title={event.ownerId} className="font-mono text-xs text-zinc-500">
            Guest {event.ownerId.slice(0, 8)}&hellip;
          </span>
        ),
    },
    {
      header: "Changed",
      render: (event) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <Badge tone={event.kind === "cart" ? "blue" : "neutral"}>
            {event.kind === "cart" ? "Cart" : "Wishlist"}
          </Badge>
          <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
            {event.kind === "cart"
              ? `${event.itemCount} unit${event.itemCount === 1 ? "" : "s"}`
              : `${event.itemCount} saved`}
          </span>
        </span>
      ),
    },
    {
      header: "When",
      render: (event) => <span className="whitespace-nowrap">{formatDate(event.updatedAt)}</span>,
    },
  ];

  return (
    <Panel
      title="Recent cart & wishlist activity"
      aside={<PanelLink href="/admin/inspector">Open inspector</PanelLink>}
    >
      <DataTable
        columns={columns}
        rows={events}
        emptyState={
          <EmptyState
            title="No cart or wishlist activity yet"
            description="Changes appear here when shoppers add products to a cart or wishlist."
            action={
              <Link href="/" className={emptySecondaryActionClass}>
                Open the storefront
              </Link>
            }
          />
        }
      />
    </Panel>
  );
}

// --- Small layout helpers used only on this page ---

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{children}</h2>
  );
}

function Panel({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
      {children} &rarr;
    </Link>
  );
}
