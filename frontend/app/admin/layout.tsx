import type { Metadata } from "next";
import AdminShell from "../../components/admin/AdminShell";

export const metadata: Metadata = {
  // Combined with the root layout's template this renders "Admin | TynocStore".
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
};

/**
 * Layout for every /admin route.
 *
 * Because this file sits outside the (store) group it does NOT inherit the
 * shop header, footer or cart providers - only the root <html>/<body>.
 * It stays a Server Component and delegates the interactive sidebar to
 * <AdminShell />, which is the client part.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
