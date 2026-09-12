import Link from "next/link";
import { Category } from "../types";

/**
 * A row of filter links. Selecting one adds ?category=<id> to the URL.
 * Because filtering is done through the URL, the homepage (a Server Component)
 * can read it from `searchParams` and fetch the right products on the server.
 */
export default function CategoryFilter({
  categories,
  activeCategory,
}: {
  categories: Category[];
  activeCategory?: string;
}) {
  // "All" is active when no category is selected.
  const baseClasses =
    "rounded-full border px-4 py-1.5 text-sm font-medium transition";
  const activeClasses =
    "border-blue-600 bg-blue-600 text-white";
  const inactiveClasses =
    "border-zinc-300 text-zinc-700 hover:border-blue-600 dark:border-zinc-700 dark:text-zinc-300";

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/#products"
        className={`${baseClasses} ${
          !activeCategory ? activeClasses : inactiveClasses
        }`}
      >
        All
      </Link>

      {categories.map((category) => {
        const isActive = category.id === activeCategory;
        return (
          <Link
            key={category.id}
            href={`/?category=${category.id}#products`}
            className={`${baseClasses} ${
              isActive ? activeClasses : inactiveClasses
            }`}
          >
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
