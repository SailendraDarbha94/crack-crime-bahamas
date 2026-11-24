import { BUTTON } from "@/components/ui/buttonStyles";
import Link from "next/link";

const NotFoundPage = () => {
  return (
    <section className="min-h-screen font-nunito">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-sm text-center bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-[0_8px_32px_rgba(120,72,10,0.12)]">
          <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)]">
            404
          </h1>
          <p className="mb-4 text-3xl tracking-tight font-bold text-amber-950 md:text-4xl">
            Something&apos;s missing.
          </p>
          <p className="mb-4 text-lg font-light text-amber-900/80">
            Sorry, we can&apos;t find that page. You&apos;ll find lots to
            explore on the home page.{" "}
          </p>
          <Link
            href="/"
            className={`${BUTTON} my-4`}
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage
