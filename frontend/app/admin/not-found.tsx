import Link from "next/link";

/**
 * Shown when an admin page calls notFound() (e.g. editing a deleted product).
 * Because it lives in app/admin/, it renders inside the admin sidebar layout
 * instead of the plain global 404 page.
 */
export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl font-bold text-blue-600">404</p>
      <h1 className="mt-4 text-xl font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-zinc-500">
        This item doesn&apos;t exist or was deleted.
      </p>
      <Link
        href="/admin/products"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Back to products
      </Link>
    </div>
  );
}
