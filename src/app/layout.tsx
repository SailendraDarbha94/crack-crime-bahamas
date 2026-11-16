//"use client";
import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import { NextUIProvider } from "@nextui-org/react";
import ToastContextProvider from "@/lib/toastContext";
import WebNavbar from "@/components/WebNavbar";
import { APP_STORE_ID } from "@/constants/appLinks";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://crackcrimebahamas.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Crack Crime Bahamas — Report Crime Anonymously",
    template: "%s | Crack Crime Bahamas",
  },
  description:
    "Crack Crime Bahamas helps citizens report crimes and submit tips anonymously, and view wanted and missing persons. Together we keep our communities safe.",
  keywords: [
    "Crack Crime Bahamas",
    "Crime Stoppers Bahamas",
    "anonymous crime tip",
    "wanted persons Bahamas",
    "missing persons Bahamas",
    "328-TIPS",
  ],
  applicationName: "Crack Crime Bahamas",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Crack Crime Bahamas",
    title: "Crack Crime Bahamas — Report Crime Anonymously",
    description:
      "Report crimes and submit tips anonymously, and view wanted and missing persons in the Bahamas.",
    url: siteUrl,
    images: [{ url: "/newfavicon.png", width: 512, height: 512, alt: "Crack Crime Bahamas" }],
  },
  twitter: {
    card: "summary",
    title: "Crack Crime Bahamas — Report Crime Anonymously",
    description:
      "Report crimes and submit tips anonymously, and view wanted and missing persons in the Bahamas.",
    images: ["/newfavicon.png"],
  },
  robots: { index: true, follow: true },
  // Safari's own "Get the app" banner, on an iPhone or iPad. Safari draws it,
  // shows it only where the app is available (the Bahamas App Store, for
  // now), switches it to "Open" when the app is installed, and stops showing
  // it once the visitor closes it. Pages where it does not belong set
  // `itunes: null`: the tip form, the privacy policy (the app opens it, so the
  // banner would offer the app to someone already in it), and the staff pages.
  itunes: { appId: APP_STORE_ID },
};

export const viewport = {
  themeColor: "#f59e0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Crack Crime Bahamas",
    alternateName: "Crime Stoppers Bahamas",
    url: siteUrl,
    logo: `${siteUrl}/newfavicon.png`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+1-242-328-8477",
        contactType: "Anonymous Tip Hotline",
        areaServed: "BS",
      },
      {
        "@type": "ContactPoint",
        telephone: "+1-242-322-3320",
        contactType: "Office",
        email: "crimestoppersbahamas@gmail.com",
        areaServed: "BS",
      },
    ],
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
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
