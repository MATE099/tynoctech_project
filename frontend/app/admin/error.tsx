"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";

/**
 * Error boundary for every /admin page.
 *
 * Pages already catch expected failures (DynamoDB offline) and show an inline
 * <ErrorState />. This file catches everything else: a bug that throws while
 * rendering, a bad record, a crashed component. Without it, the root
 * app/error.tsx would take over and the admin sidebar would disappear.
 *
 * It sits below admin/layout.tsx, so the sidebar stays on screen and the
 * admin can simply navigate somewhere else.
 */
export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // A real app would send this to a logging service (Sentry, etc.).
    console.error("Admin page crashed:", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900 dark:bg-red-950/40"
    >
      <h1 className="text-xl font-semibold text-red-900 dark:text-red-200">
        This admin page crashed
      </h1>
      <p className="mt-2 text-sm text-red-800 dark:text-red-300">
        Something unexpected went wrong while loading it. Your data was not
        changed. Try again, or go back to the dashboard.
      </p>

      {/* In production, server error messages are hidden for security and
          only the digest is sent. It matches the error in the server logs. */}
      {error.digest && (
        <p className="mt-4 font-mono text-xs text-red-700 dark:text-red-400">
          Error reference: {error.digest}
        </p>
      )}

      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Try again
        </button>
        <Link
          href="/admin"
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/40"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
