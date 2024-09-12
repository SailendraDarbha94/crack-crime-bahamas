//"use client";
import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { NextUIProvider } from "@nextui-org/react";

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
          <Navbar />
          {children}
          <Footer />
        </NextUIProvider>
      </body>
    </html>
  );
}
