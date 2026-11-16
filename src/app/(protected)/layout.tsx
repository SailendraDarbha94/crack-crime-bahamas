import AdminGuard from "@/components/AdminGuard";
import type { Metadata } from "next";

// Staff pages carry no App Store banner (see the root layout): the app is for
// the public. Page settings can only come from a server layout, so this file
// is not a client component; the guard and sidebar it renders are.
export const metadata: Metadata = { itunes: null };

// Route group that keeps its pages at their top-level URLs (/wanted,
// /missing) but requires an admin login to view them. No admin sidebar —
// these are content pages, just gated. The tip form used to live here; it is
// public now, at /submit-tip.
export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminGuard>{children}</AdminGuard>;
}
