import type { Metadata } from "next";

// Staff sign-in and the request for an admin account. No App Store banner here
// (see the root layout): the app is for the public, and these pages are for
// staff. A route group's layout adds nothing to the address.
export const metadata: Metadata = { itunes: null };

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
