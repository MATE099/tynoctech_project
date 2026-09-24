import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Badge from "../../../../components/admin/Badge";
import DataTable, { Column } from "../../../../components/admin/DataTable";
import ErrorState from "../../../../components/admin/ErrorState";
import ProductRef from "../../../../components/admin/ProductRef";
import RawRecord from "../../../../components/admin/RawRecord";
import StatCard from "../../../../components/admin/StatCard";
import StockBadge from "../../../../components/admin/StockBadge";
import { formatDate, formatPrice } from "../../../../lib/format";
import {
  getUserOverview,
  InspectedCartLine,
  InspectedWishlistLine,
  UserOverview,
} from "../../../../lib/services/inspector";

export const metadata: Metadata = { title: "User details" };

// DataTable needs an `id` on every row; within one cart or wishlist the
// product id is unique (duplicates are merged when items are added).
type CartRow = InspectedCartLine & { id: string };
type WishlistRow = InspectedWishlistLine & { id: string };

const cartColumns: Column<CartRow>[] = [
  {
    header: "Product",
    render: (line) => <ProductRef productId={line.productId} product={line.product} />,
  },
  {
    header: "Unit price",
    className: "text-right",
    render: (line) => (
      <span className="tabular-nums">
        {line.product ? formatPrice(line.product.price) : "—"}
      </span>
    ),
  },
  {
    header: "Qty",
    className: "text-right",
    render: (line) => <span className="tabular-nums">{line.quantity}</span>,
  },
  {
    header: "Line total",
    className: "text-right",
    render: (line) => (
      <span className="tabular-nums font-medium">
        {line.product ? formatPrice(line.lineTotal) : "—"}
      </span>
    ),
  },
  {
    header: "Check",
    render: (line) =>
      !line.product ? (
        <Badge tone="red">Missing product</Badge>
      ) : line.exceedsStock ? (
        <Badge tone="amber">Only {line.product.stock} in stock</Badge>
      ) : (
        <Badge tone="green">OK</Badge>
      ),
  },
];

const wishlistColumns: Column<WishlistRow>[] = [
  {
    header: "Product",
    render: (line) => <ProductRef productId={line.productId} product={line.product} />,
  },
  {
    header: "Price",
    className: "text-right",
    render: (line) => (
      <span className="tabular-nums">
        {line.product ? formatPrice(line.product.price) : "—"}
      </span>
    ),
  },
  {
    header: "Stock",
    render: (line) =>
      line.product ? <StockBadge stock={line.product.stock} /> : <Badge tone="red">Missing</Badge>,
  },
  {
    header: "Added",
    render: (line) => (
      <span className="whitespace-nowrap">{formatDate(line.addedAt)}</span>
    ),
  },
];

/**
 * User detail page (route: /admin/users/:id).
 * Profile, cart and wishlist for one user, read straight from DynamoDB with
 * the user's id as the key, plus the raw stored items for inspection.
 */
export default async function AdminUserPage({
  params,
}: PageProps<"/admin/users/[id]">) {
  const { id } = await params;

  let overview: UserOverview | null = null;
  let loadError = false;

  try {
    overview = await getUserOverview(id);
  } catch (error) {
    console.error(`Failed to load user ${id}:`, error);
    loadError = true;
  }

  // Called outside the try/catch: notFound() works by throwing.
  if (!loadError && !overview) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
          &larr; Back to users
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {overview?.user.name ?? "User"}
        </h1>
        {overview && <p className="mt-1 text-sm text-zinc-500">{overview.user.email}</p>}
      </div>

      {loadError || !overview ? (
        <ErrorState
          title="Could not load this user"
          message="Check that DynamoDB is running, then refresh."
        />
      ) : (
        <UserDetails overview={overview} />
      )}
    </div>
  );
}

function UserDetails({ overview }: { overview: UserOverview }) {
  const { user, cart, wishlist } = overview;
  const issues = cart.brokenCount + wishlist.brokenCount;

  return (
    <>
      <dl className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 text-sm sm:grid-cols-2 lg:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Detail label="User ID" value={<span className="font-mono text-xs">{user.id}</span>} />
        <Detail label="Joined" value={formatDate(user.createdAt)} />
        <Detail label="Cart updated" value={formatDate(cart.raw?.updatedAt)} />
        <Detail label="Wishlist updated" value={formatDate(wishlist.raw?.updatedAt)} />
      </dl>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cart units" value={String(cart.units)} />
        <StatCard label="Cart value" value={formatPrice(cart.subtotal)} />
        <StatCard label="Wishlist items" value={String(wishlist.lines.length)} />
        <StatCard
          label="Broken references"
          value={String(issues)}
          hint={issues ? "Items pointing at deleted products" : "All items resolve"}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cart</h2>
        <DataTable
          columns={cartColumns}
          rows={cart.lines.map((line) => ({ ...line, id: line.productId }))}
          emptyMessage={
            cart.raw ? "The cart exists but is empty." : "This user has no cart yet."
          }
        />
        {cart.lines.length > 0 && (
          <p className="text-right text-sm">
            Subtotal:{" "}
            <span className="font-semibold tabular-nums">{formatPrice(cart.subtotal)}</span>
          </p>
        )}
        <RawRecord label={`Raw Carts item (id = ${user.id})`} record={cart.raw} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Wishlist</h2>
        <DataTable
          columns={wishlistColumns}
          rows={wishlist.lines.map((line) => ({ ...line, id: line.productId }))}
          emptyMessage={
            wishlist.raw
              ? "The wishlist exists but is empty."
              : "This user has no wishlist yet."
          }
        />
        <RawRecord label={`Raw Wishlists item (id = ${user.id})`} record={wishlist.raw} />
      </section>
    </>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
