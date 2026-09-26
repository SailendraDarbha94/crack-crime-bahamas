"use client";
import RoleGuard from "@/components/RoleGuard";
import Sidebar from "@/components/Sidebar";

// Police portal. Officers land here after signing in; admins may open it too,
// to see exactly what officers see. Everything under /police is read-only.
export default function PoliceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuard allow={["police", "admin"]}>
      <main className="flex w-full flex-wrap">
        <div className="hidden md:block p-2 md:w-3/12 lg:w-3/12 xl:w-2/12">
          <Sidebar variant="police" />
        </div>
        <div className="w-full md:w-9/12 lg:w-9/12 xl:w-10/12">
          <div>{children}</div>
        </div>
      </main>
    </RoleGuard>
  );
}
