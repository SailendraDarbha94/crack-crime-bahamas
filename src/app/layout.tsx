import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Client from "./Client";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CrackCrimeBahamas",
  description: "Your safety is our priority.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Client>{children}</Client>
      </body>
    </html>
  );
}
