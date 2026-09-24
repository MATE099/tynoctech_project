"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Sidebar links. Keeping them in one array means we render the markup once in
 * a loop instead of copy-pasting an <a> per link.
 */
const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/inspector", label: "Carts & Wishlists" },
];

/**
 * Admin chrome: fixed sidebar on desktop, slide-in drawer on mobile.
 *
 * This is a Client Component ("use client") because it holds state for the
 * mobile menu and reads the current URL to highlight the active link.
 * Keeping it separate lets admin/layout.tsx stay a Server Component.
 */
export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  // usePathname() gives the current URL path, e.g. "/admin/products".
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Dark backdrop behind the mobile drawer. Only rendered when open. */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-900 lg:static lg:translate-x-0 ${
          // On mobile the sidebar is pushed off-screen until opened.
          // `lg:translate-x-0` cancels that on large screens.
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-zinc-200 px-5 py-5 dark:border-zinc-800">
          <Link href="/admin" className="text-lg font-bold tracking-tight">
            Tynoc<span className="text-blue-600">Admin</span>
          </Link>
          <p className="mt-1 text-xs text-zinc-500">Store management</p>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            // "/admin" must match exactly, otherwise it would stay highlighted
            // on every sub-page because every admin URL starts with "/admin".
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                // Close the drawer after navigating on mobile.
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            &larr; Back to storefront
          </Link>
        </div>
      </aside>

      {/* min-w-0 stops a wide table from stretching this column past the screen */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-100 lg:hidden dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Menu
          </button>
          <p className="text-sm font-medium text-zinc-500">Administration</p>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
