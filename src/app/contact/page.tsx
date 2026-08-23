import Link from "next/link";

export const metadata = {
  title: "Contact",
  description:
    "Get in touch with Crack Crime Bahamas, or report a crime anonymously via the 328-TIPS hotline.",
};

const ContactPage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-20 font-nunito">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-center text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.55)] mb-3">
          Contact Us
        </h1>
        <p className="text-center text-amber-900/80 mb-8">
          To report a crime anonymously, use the tip hotline or our secure
          online form. For general enquiries, reach us by phone or email.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="tel:+12423288477"
            className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_32px_rgba(120,72,10,0.12)] text-center hover:bg-white/35 transition-all duration-200"
          >
            <h2 className="text-lg font-bold text-amber-950 mb-1">Tip Hotline</h2>
            <p className="text-2xl font-extrabold text-amber-950">328-TIPS</p>
            <p className="text-amber-900/70 text-sm">(8477) &mdash; tap to call</p>
          </a>

          <a
            href="mailto:crimestoppersbahamas@gmail.com"
            className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_32px_rgba(120,72,10,0.12)] text-center hover:bg-white/35 transition-all duration-200"
          >
            <h2 className="text-lg font-bold text-amber-950 mb-1">Email</h2>
            <p className="text-amber-950 font-semibold break-words">
              crimestoppersbahamas@gmail.com
            </p>
          </a>

          <a
            href="tel:+12423223320"
            className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_32px_rgba(120,72,10,0.12)] text-center hover:bg-white/35 transition-all duration-200"
          >
            <h2 className="text-lg font-bold text-amber-950 mb-1">Office</h2>
            <p className="text-amber-950 font-semibold">1-242-322-3320</p>
          </a>

          <Link
            href="/submit-tip"
            className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_32px_rgba(120,72,10,0.12)] text-center hover:bg-white/35 transition-all duration-200"
          >
            <h2 className="text-lg font-bold text-amber-950 mb-1">Submit a Tip</h2>
            <p className="text-amber-900/80 text-sm">
              Report online, anonymously and encrypted
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ContactPage;
