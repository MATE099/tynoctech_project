import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { CartProvider } from "../../components/CartProvider";
import { WishlistProvider } from "../../components/WishlistProvider";
import CartDrawer from "../../components/CartDrawer";

/**
 * Layout for the public storefront only.
 *
 * "(store)" is a ROUTE GROUP: the parentheses mean the folder organises files
 * without becoming part of the URL, so (store)/page.tsx is still "/".
 * Everything the shop needs (cart state, header, footer) lives here instead of
 * the root layout, which keeps it out of the /admin pages.
 */
export default function StoreLayout({ children }: LayoutProps<"/"> ) {
  return (
    <CartProvider>
      <WishlistProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          {/* flex-1 pushes the footer down on short pages */}
          <main className="flex-1">{children}</main>
          <Footer />
          {/* Rendered once so the drawer can open from any shop page. */}
          <CartDrawer />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}
