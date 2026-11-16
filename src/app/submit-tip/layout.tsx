import type { Metadata } from "next";

// The tip form is a client component, so its metadata lives here.
//
// `referrer: no-referrer` stops the browser telling the next page (or site)
// that the visitor arrived from the tip form.
//
// `itunes: null` keeps Safari's App Store banner (set in the root layout) off
// this page: someone part way through writing a tip should not be invited to
// leave for the App Store, and the form should involve nobody but this site.
export const metadata: Metadata = {
  title: "Submit an Anonymous Tip",
  description:
    "Report a crime to Crime Stoppers Bahamas anonymously. Choose the type of crime, write what you know, and get a PIN for following up. We never ask who you are.",
  alternates: { canonical: "/submit-tip" },
  referrer: "no-referrer",
  itunes: null,
};

export default function SubmitTipLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
