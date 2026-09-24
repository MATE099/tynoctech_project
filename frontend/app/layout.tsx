import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // `template` is used by child layouts/pages that set their own title,
  // so the admin area can render "Dashboard | TynocStore".
  title: {
    default: "TynocStore",
    template: "%s | TynocStore",
  },
  description: "E-commerce storefront and admin dashboard.",
};

/**
 * Root layout: only <html>, fonts and global CSS.
 *
 * Storefront chrome (header/footer/cart) lives in (store)/layout.tsx and admin
 * chrome lives in admin/layout.tsx, so the two areas stay fully independent.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
