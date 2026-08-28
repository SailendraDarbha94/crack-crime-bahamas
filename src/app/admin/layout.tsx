"use client";
import AdminGuard from "@/components/AdminGuard";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminGuard>
      <main className="flex w-full flex-wrap">
        <div className="hidden md:block p-2 md:w-3/12 lg:w-3/12 xl:w-2/12">
          <Sidebar />
        </div>
        <div className="w-full md:w-9/12 lg:w-9/12 xl:w-10/12">
          <div>
            {children}
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
