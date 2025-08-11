"use client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import WebNavbar from "@/components/WebNavbar";
import app from "@/lib/firebase";
import { ToastContext } from "@/lib/toastContext";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
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
  );
}
