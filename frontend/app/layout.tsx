import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CartProvider } from "../components/CartProvider";
import { WishlistProvider } from "../components/WishlistProvider";
import CartDrawer from "../components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TynocStore",
  description: "A modern storefront built for the internship project.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Providers make cart + wishlist state available to every component.
            They're client components, but can still wrap server components. */}
        <CartProvider>
          <WishlistProvider>
            <Header />
            {/* flex-1 pushes the footer to the bottom on short pages */}
            <main className="flex-1">{children}</main>
            <Footer />
            {/* Rendered once here so the drawer can open from any page. */}
            <CartDrawer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
