"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

/**
 * App-level error boundary. If any page throws while rendering, Next.js shows
 * this instead of a blank/crashed screen. `retry` re-renders the segment.
 *
 * Note: this does NOT catch errors in the root layout itself (that needs
 * global-error.js). Header and footer stay visible.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // In a real app you'd send this to a logging service (Sentry, etc.).
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-zinc-500">
        An unexpected error occurred. You can try again.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-8 rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
