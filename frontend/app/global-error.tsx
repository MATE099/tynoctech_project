"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import "./globals.css";

/**
 * Last-resort error boundary for errors in the ROOT layout itself.
 *
 * When this shows, app/layout.tsx has failed, so there is no <html> or
 * <body> from it. This file must render its own, and import the global CSS
 * itself, or Tailwind classes would not apply.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Root layout crashed:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {/* No metadata export is allowed here, so the title is set inline. */}
        <title>Something went wrong | TynocStore</title>
        <main className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-zinc-500">
            The site failed to load. Please try again in a moment.
          </p>
          {error.digest && (
            <p className="mt-4 font-mono text-xs text-zinc-400">
              Error reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => retry()}
            className="mt-8 rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
