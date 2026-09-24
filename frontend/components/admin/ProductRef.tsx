import Image from "next/image";
import Link from "next/link";
import Badge from "./Badge";
import { Product } from "../../types";

/**
 * How the admin shows a product referenced by a cart or wishlist.
 *
 * `product` is null when the stored productId points at a deleted product.
 * We still print the raw id so the admin can see exactly what is in the
 * database, instead of the item silently disappearing.
 */
export default function ProductRef({
  productId,
  product,
}: {
  productId: string;
  product: Product | null;
}) {
  if (!product) {
    return (
      <div className="flex min-w-48 flex-col items-start gap-1">
        <Badge tone="red">Deleted product</Badge>
        <span className="font-mono text-xs text-zinc-500">{productId}</span>
      </div>
    );
  }

  return (
    <div className="flex min-w-48 items-center gap-3">
      <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-700">
        <Image
          src={product.imageUrl}
          alt=""
          fill
          sizes="36px"
          className="object-contain p-0.5"
        />
      </div>
      <div className="min-w-0">
        <Link
          href={`/admin/products/${encodeURIComponent(product.id)}/edit`}
          className="block truncate font-medium hover:underline"
        >
          {product.name}
        </Link>
        <span className="block truncate font-mono text-xs text-zinc-500">
          {product.id}
        </span>
      </div>
    </div>
  );
}
