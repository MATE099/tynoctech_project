import Link from "next/link";
import type { Metadata } from "next";
import Badge from "../../../components/admin/Badge";
import DataTable, { Column } from "../../../components/admin/DataTable";
import EmptyState, { emptySecondaryActionClass } from "../../../components/admin/EmptyState";
import ErrorState from "../../../components/admin/ErrorState";
import ProductRef from "../../../components/admin/ProductRef";
import StatCard from "../../../components/admin/StatCard";
import { formatDate, formatPrice } from "../../../lib/format";
import {
  CartRecord,
  getInspectorData,
  InspectorData,
  OwnerType,
  ProductRelationship,
  WishlistRecord,
} from "../../../lib/services/inspector";

export const metadata: Metadata = { title: "Cart & Wishlist Inspector" };

const VIEWS = {
  carts: "Carts",
  wishlists: "Wishlists",
  products: "Products",
} as const;
type View = keyof typeof VIEWS;

const OWNER_FILTERS = { all: "All owners", user: "Users", guest: "Guests" } as const;
type OwnerFilter = keyof typeof OWNER_FILTERS;

function isView(value: unknown): value is View {
  return typeof value === "string" && Object.hasOwn(VIEWS, value);
}
function isOwnerFilter(value: unknown): value is OwnerFilter {
  return typeof value === "string" && Object.hasOwn(OWNER_FILTERS, value);
}

/** Link to this page with the given view/owner, used by the tabs and filters. */
function inspectorHref(view: View, owner: OwnerFilter) {
  const params = new URLSearchParams({ view });
  if (owner !== "all") params.set("owner", owner);
  return `/admin/inspector?${params}`;
}

/**
 * Cart & Wishlist Inspector (route: /admin/inspector).
 *
 * Shows the Carts and Wishlists tables as they really are, with each row's
 * owner resolved (registered user or guest session) and each item resolved
 * against Products. The "Products" tab flips the relationship around: for
 * every product, how many carts and wishlists reference it.
 */
export default async function InspectorPage({
  searchParams,
}: PageProps<"/admin/inspector">) {
  const { view: viewParam, owner: ownerParam } = await searchParams;
  const view: View = isView(viewParam) ? viewParam : "carts";
  const owner: OwnerFilter = isOwnerFilter(ownerParam) ? ownerParam : "all";

  let data: InspectorData | null = null;
  try {
    data = await getInspectorData();
  } catch (error) {
    console.error("Failed to load inspector data:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cart &amp; Wishlist Inspector
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Raw cart and wishlist data from DynamoDB, joined with its users and products.
        </p>
      </div>

      {!data ? (
        <ErrorState
          title="Could not load cart and wishlist data"
          message="Check that DynamoDB is running and your .env.local is configured, then refresh."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Carts"
              value={String(data.stats.carts)}
              hint={`${data.stats.userCarts} users · ${data.stats.guestCarts} guests · ${data.stats.emptyCarts} empty`}
            />
            <StatCard label="Wishlists" value={String(data.stats.wishlists)} />
            <StatCard label="Units in carts" value={String(data.stats.unitsInCarts)} />
            <StatCard
              label="Broken references"
              value={String(data.stats.brokenReferences)}
              hint="Items pointing at deleted products"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800" aria-label="Inspector views">
              {(Object.keys(VIEWS) as View[]).map((key) => (
                <Link
                  key={key}
                  href={inspectorHref(key, owner)}
                  aria-current={key === view ? "page" : undefined}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    key === view
                      ? "bg-white shadow-sm dark:bg-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  {VIEWS[key]}
                </Link>
              ))}
            </nav>

            {/* Owner filter only makes sense for the per-owner tables. */}
            {view !== "products" && (
              <div className="flex gap-2 text-sm">
                {(Object.keys(OWNER_FILTERS) as OwnerFilter[]).map((key) => (
                  <Link
                    key={key}
                    href={inspectorHref(view, key)}
                    className={`rounded-full border px-3 py-1 transition ${
                      key === owner
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-zinc-300 hover:border-blue-600 dark:border-zinc-700"
                    }`}
                  >
                    {OWNER_FILTERS[key]}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {view === "carts" && (
            <CartsTable carts={byOwner(data.carts, owner)} owner={owner} />
          )}
          {view === "wishlists" && (
            <WishlistsTable wishlists={byOwner(data.wishlists, owner)} owner={owner} />
          )}
          {view === "products" && <ProductsTable products={data.products} />}
        </>
      )}
    </div>
  );
}

function byOwner<T extends { ownerType: OwnerType }>(rows: T[], owner: OwnerFilter): T[] {
  return owner === "all" ? rows : rows.filter((row) => row.ownerType === owner);
}

/** The owner cell: a link for registered users, a shortened id for guests. */
function OwnerCell({ id, ownerType, ownerName }: { id: string; ownerType: OwnerType; ownerName: string | null }) {
  return ownerType === "user" ? (
    <div className="min-w-40 space-y-1">
      <Badge tone="blue">User</Badge>
      <Link
        href={`/admin/users/${encodeURIComponent(id)}`}
        className="block font-medium hover:underline"
      >
        {ownerName}
      </Link>
    </div>
  ) : (
    <div className="min-w-40 space-y-1">
      <Badge>Guest</Badge>
      {/* The full id is in the title tooltip; 8 characters are enough to tell rows apart. */}
      <span title={id} className="block font-mono text-xs text-zinc-500">
        session {id.slice(0, 8)}&hellip;
      </span>
    </div>
  );
}

/** Expandable list of items, so a row stays one line until you open it. */
function ItemList({ count, children }: { count: number; children: React.ReactNode }) {
  if (count === 0) return <span className="text-zinc-400">Empty</span>;
  return (
    <details>
      <summary className="cursor-pointer select-none text-sm font-medium text-blue-600 dark:text-blue-400">
        {count} product{count === 1 ? "" : "s"}
      </summary>
      <ul className="mt-3 space-y-3">{children}</ul>
    </details>
  );
}

function IssueCell({ brokenCount, extra }: { brokenCount: number; extra?: number }) {
  if (brokenCount > 0) return <Badge tone="red">{brokenCount} missing</Badge>;
  if (extra) return <Badge tone="amber">{extra} over stock</Badge>;
  return <Badge tone="green">OK</Badge>;
}

/**
 * Empty carts/wishlists tab. With a filter on, the rows may exist for the
 * other owner type, so we offer to show all owners instead.
 */
function OwnerEmptyState({ kind, owner }: { kind: "carts" | "wishlists"; owner: OwnerFilter }) {
  if (owner !== "all") {
    return (
      <EmptyState
        title={`No ${kind} owned by ${owner === "user" ? "registered users" : "guests"}`}
        action={
          <Link href={inspectorHref(kind, "all")} className={emptySecondaryActionClass}>
            Show all owners
          </Link>
        }
      />
    );
  }
  return (
    <EmptyState
      title={`No ${kind} in DynamoDB yet`}
      description={
        kind === "carts"
          ? "A Carts row is created the first time a shopper adds a product to their cart."
          : "A Wishlists row is created the first time a shopper saves a product."
      }
      action={
        <Link href="/" className={emptySecondaryActionClass}>
          Open the storefront
        </Link>
      }
    />
  );
}

function CartsTable({ carts, owner }: { carts: CartRecord[]; owner: OwnerFilter }) {
  const columns: Column<CartRecord>[] = [
    { header: "Owner", render: (cart) => <OwnerCell {...cart} /> },
    {
      header: "Items",
      render: (cart) => (
        <ItemList count={cart.lines.length}>
          {cart.lines.map((line) => (
            <li key={line.productId} className="flex items-center justify-between gap-4">
              <ProductRef productId={line.productId} product={line.product} />
              <span className="whitespace-nowrap tabular-nums text-zinc-500">
                &times; {line.quantity}
              </span>
            </li>
          ))}
        </ItemList>
      ),
    },
    {
      header: "Units",
      className: "text-right",
      render: (cart) => <span className="tabular-nums">{cart.units}</span>,
    },
    {
      header: "Value",
      className: "text-right",
      render: (cart) => <span className="tabular-nums">{formatPrice(cart.subtotal)}</span>,
    },
    {
      header: "Updated",
      render: (cart) => <span className="whitespace-nowrap">{formatDate(cart.updatedAt)}</span>,
    },
    {
      header: "Check",
      render: (cart) => (
        <IssueCell
          brokenCount={cart.brokenCount}
          extra={cart.lines.filter((line) => line.exceedsStock).length}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={carts}
      emptyState={<OwnerEmptyState kind="carts" owner={owner} />}
    />
  );
}

function WishlistsTable({ wishlists, owner }: { wishlists: WishlistRecord[]; owner: OwnerFilter }) {
  const columns: Column<WishlistRecord>[] = [
    { header: "Owner", render: (list) => <OwnerCell {...list} /> },
    {
      header: "Items",
      render: (list) => (
        <ItemList count={list.lines.length}>
          {list.lines.map((line) => (
            <li key={line.productId}>
              <ProductRef productId={line.productId} product={line.product} />
            </li>
          ))}
        </ItemList>
      ),
    },
    {
      header: "Updated",
      render: (list) => <span className="whitespace-nowrap">{formatDate(list.updatedAt)}</span>,
    },
    { header: "Check", render: (list) => <IssueCell brokenCount={list.brokenCount} /> },
  ];

  return (
    <DataTable
      columns={columns}
      rows={wishlists}
      emptyState={<OwnerEmptyState kind="wishlists" owner={owner} />}
    />
  );
}

function ProductsTable({ products }: { products: ProductRelationship[] }) {
  const columns: Column<ProductRelationship>[] = [
    { header: "Product", render: (row) => <ProductRef productId={row.id} product={row.product} /> },
    {
      header: "In carts",
      className: "text-right",
      render: (row) => <span className="tabular-nums">{row.cartCount}</span>,
    },
    {
      header: "Units in carts",
      className: "text-right",
      render: (row) => (
        <span className={`tabular-nums ${row.product && row.cartUnits > row.product.stock ? "font-semibold text-amber-700 dark:text-amber-400" : ""}`}>
          {row.cartUnits}
        </span>
      ),
    },
    {
      header: "Stock",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums">{row.product ? row.product.stock : "—"}</span>
      ),
    },
    {
      header: "In wishlists",
      className: "text-right",
      render: (row) => <span className="tabular-nums">{row.wishlistCount}</span>,
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-500">
        Every product that appears in at least one cart or wishlist, most referenced first.
        Units shown in amber exceed the product&apos;s current stock.
      </p>
      <DataTable
        columns={columns}
        rows={products}
        emptyState={
          <EmptyState
            title="No product is in any cart or wishlist yet"
            description="This view fills up as shoppers add products to carts and wishlists."
          />
        }
      />
    </div>
  );
}
