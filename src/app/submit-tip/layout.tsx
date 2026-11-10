import type { Metadata } from "next";

// The tip form is a client component, so its metadata lives here.
//
// `referrer: no-referrer` stops the browser telling the next page (or site)
// that the visitor arrived from the tip form.
export const metadata: Metadata = {
  title: "Submit an Anonymous Tip",
  description:
    "Report a crime to Crime Stoppers Bahamas anonymously. Choose the type of crime, write what you know, and get a PIN for following up. We never ask who you are.",
  alternates: { canonical: "/submit-tip" },
  referrer: "no-referrer",
};

export default function SubmitTipLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
