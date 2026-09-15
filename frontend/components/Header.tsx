import Link from "next/link";
import CartButton from "./CartButton";

/**
 * Site-wide navigation header.
 * Stays a Server Component; it just renders the interactive <CartButton />
 * (a Client Component) inside it.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Tynoc<span className="text-blue-600">Store</span>
        </Link>

        <ul className="flex items-center gap-6 text-sm font-medium">
          <li>
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>
          </li>
          <li>
            <Link href="/#products" className="hover:text-blue-600">
              Products
            </Link>
          </li>
          <li>
            <Link href="/wishlist" className="hover:text-blue-600">
              Wishlist
            </Link>
          </li>
          <li>
            <CartButton />
          </li>
        </ul>
      </nav>
    </header>
  );
}
