"use client";
import RoleGuard from "@/components/RoleGuard";

// Admin-only pages. Kept as its own component so existing layouts keep
// importing AdminGuard; the logic lives in RoleGuard.
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow={["admin"]}>{children}</RoleGuard>;
}
