//"use client";
import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { NextUIProvider } from "@nextui-org/react";
import ToastContextProvider from "@/lib/toastContext";
import WebNavbar from "@/components/WebNavbar";

export const metadata: Metadata = {
  title: "Crack Crime Bahamas",
  description: "Safety is Key",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NextUIProvider>
          <ToastContextProvider>
            <div className="w-full pt-2">
              <WebNavbar />
            </div>
            {children}
            <Footer />
          </ToastContextProvider>
        </NextUIProvider>
      </body>
    </html>
  );
}
