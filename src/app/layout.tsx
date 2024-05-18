import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crime Stoppers",
  description: "Your safety is our priority.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
