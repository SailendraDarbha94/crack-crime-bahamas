"use client";
import AdminGuard from "@/components/AdminGuard";

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
