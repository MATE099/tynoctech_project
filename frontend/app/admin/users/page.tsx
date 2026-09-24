import Form from "next/form";
import Link from "next/link";
import type { Metadata } from "next";
import DataTable, { Column } from "../../../components/admin/DataTable";
import ErrorState from "../../../components/admin/ErrorState";
import { formatDate } from "../../../lib/format";
import {
  filterUsers,
  getUsersWithActivity,
  UserWithActivity,
} from "../../../lib/services/inspector";

export const metadata: Metadata = { title: "Users" };

/**
 * Admin user list (route: /admin/users).
 * Shows every registered user with a summary of their cart and wishlist.
 */
export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/users">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";

  let allUsers: UserWithActivity[] = [];
  let loadError = false;

  try {
    allUsers = await getUsersWithActivity();
  } catch (error) {
    console.error("Failed to load admin users:", error);
    loadError = true;
  }

  const users = filterUsers(allUsers, query);

  const columns: Column<UserWithActivity>[] = [
    {
      header: "User",
      render: (user) => (
        <div className="min-w-48">
          <Link
            href={`/admin/users/${encodeURIComponent(user.id)}`}
            className="font-medium hover:underline"
          >
            {user.name}
          </Link>
          <p className="text-xs text-zinc-500">{user.email}</p>
        </div>
      ),
    },
    {
      header: "ID",
      render: (user) => (
        <span className="font-mono text-xs text-zinc-500">{user.id}</span>
      ),
    },
    {
      header: "Joined",
      render: (user) => (
        <span className="whitespace-nowrap">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      header: "Cart units",
      className: "text-right",
      render: (user) => (
        <span className={`tabular-nums ${user.cartUnits ? "" : "text-zinc-400"}`}>
          {user.cartUnits}
        </span>
      ),
    },
    {
      header: "Wishlist",
      className: "text-right",
      render: (user) => (
        <span className={`tabular-nums ${user.wishlistCount ? "" : "text-zinc-400"}`}>
          {user.wishlistCount}
        </span>
      ),
    },
    {
      header: "Last activity",
      render: (user) => (
        <span className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
          {formatDate(user.lastActivity)}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (user) => (
        <Link
          href={`/admin/users/${encodeURIComponent(user.id)}`}
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Registered users and what they have saved in their cart and wishlist.
        </p>
      </div>

      <Form
        action="/admin/users"
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by name, email or ID..."
          aria-label="Search users"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-600 sm:max-w-md dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Search
          </button>
          {query && (
            <Link
              href="/admin/users"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Clear
            </Link>
          )}
        </div>
      </Form>

      {loadError ? (
        <ErrorState
          title="Could not load users"
          message="Check that DynamoDB is running and your .env.local is configured, then refresh."
        />
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            Showing {users.length} of {allUsers.length} users
          </p>
          <DataTable
            columns={columns}
            rows={users}
            emptyMessage={
              query ? "No users match this search." : "No users registered yet."
            }
          />
        </>
      )}
    </div>
  );
}
