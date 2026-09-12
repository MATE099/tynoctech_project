import Link from "next/link";

/**
 * Global 404 page. Shown for any URL that doesn't match a route.
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-24 text-center">
      <p className="text-6xl font-bold text-blue-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-zinc-500">
        Sorry, we couldn&apos;t find the page you were looking for.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
      >
        Go home
      </Link>
    </div>
  );
}
