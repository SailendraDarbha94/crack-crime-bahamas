"use client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import app from "@/lib/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  useEffect(() => {
    const auth = getAuth(app);
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("USER DETAILS", user);
      } else {
        router.push("/login");
      }
    });
  }, []);

  return (
    <main className="flex w-full flex-wrap">
      <div className="hidden md:block p-2 md:w-3/12 lg:w-2/12">
        <Sidebar />
      </div>
      <div className="w-full md:w-9/12 lg:w-10/12">{children}</div>
    </main>
  );
}
