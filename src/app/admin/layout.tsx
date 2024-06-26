"use client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import app from "@/lib/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const auth = getAuth(app);
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("USER DETAILS", user);
        setUser(user)
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
      <div className="w-full md:w-9/12 lg:w-10/12">
      <div className="w-full">
        <h2 className="text-3xl p-2 font-nunito">Admin Dashboard</h2>
        <h2 className="text-xl p-2 underline font-nunito">{user ? user.email : null}</h2>
      </div>
      {children}</div>
    </main>
  );
}
