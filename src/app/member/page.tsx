"use client";

import Link from "next/link";

// Placeholder while donations and sponsorship are rebuilt on a real payment
// flow. The route stays so the navbar, footer, About page and sitemap links
// keep resolving.
const Page = () => {
  return (
    <div className="min-h-screen p-4">
      <section className="font-nunito mb-10 mx-auto max-w-lg rounded-lg">
        <div className="flex flex-col items-center justify-center px-3 md:px-8 py-4 mx-auto md:h-screen lg:py-0">
          <Link
            href="/"
            className="flex items-center mb-6 text-2xl font-semibold text-amber-950"
          >
            <img className="w-8 h-8 mr-2" src="/newfavicon.png" alt="Crack Crime Bahamas logo" />
            Crack Crime Bahamas
          </Link>
          <div className="w-full bg-white/25 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(120,72,10,0.12)] md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 sm:p-8 text-center space-y-4">
              <p className="text-sm uppercase tracking-wide text-amber-900/70">Sponsorship &amp; Donations</p>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-amber-950 md:text-4xl">
                Coming Soon
              </h1>
              <p className="text-amber-900/80">
                We are rebuilding how you can support Crime Stoppers Bahamas.
                Please check back shortly.
              </p>
              {/* Until online payments return, supporters can give by cheque. */}
              <div className="border-t border-amber-900/15 pt-4 space-y-3">
                <p className="font-semibold text-amber-950 text-balance">
                  In the interim, please send a cheque to:
                </p>
                <address className="not-italic rounded-xl bg-white/40 border border-white/60 px-4 py-3 text-amber-950 leading-relaxed">
                  <span className="block font-bold">Crime Stoppers Bahamas</span>
                  <span className="block">P.O. Box N 665</span>
                  <span className="block">Nassau, Bahamas</span>
                </address>
              </div>
              <Link
                href="/"
                className="inline-block rounded-xl bg-white/40 backdrop-blur-md border border-white/60 hover:bg-white/55 text-amber-950 font-bold px-5 py-2.5 transition-all duration-200 active:scale-95"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Page;
