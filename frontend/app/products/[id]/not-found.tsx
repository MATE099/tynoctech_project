import Link from "next/link";

/**
 * Shown when a product id doesn't exist (triggered by notFound() in page.tsx).
 * Because it lives inside app/products/[id]/, it only replaces the product
 * detail area, keeping the header and footer from the root layout.
 */
export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-24 text-center">
      <p className="text-6xl font-bold text-blue-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Product not found</h1>
      <p className="mt-2 text-zinc-500">
        The product you are looking for doesn&apos;t exist or was removed.
      </p>
      <Link
        href="/#products"
        className="mt-8 inline-block rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
      >
        Browse all products
      </Link>
    </div>
  );
}
