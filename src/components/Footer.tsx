import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <div className="w-full">
      <footer className="p-4 bg-white/15 backdrop-blur-md border-t border-white/40 sm:p-6">
        <div className="mx-auto max-w-screen-xl">
          <div className="md:flex md:justify-between">
            <div className="mb-6 md:mb-0">
              <Link href="/" className="flex items-center">
                <img src="/newfavicon.png" className="mr-3 h-8" alt="Crack Crime Bahamas logo" />
                <span className="self-center text-2xl font-semibold whitespace-nowrap text-amber-950">
                  CrackCrimeBahamas
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
              <div>
                <h2 className="mb-6 text-sm font-semibold text-amber-900 uppercase">
                  Get Involved
                </h2>
                <ul className="text-amber-800/80">
                  <li className="mb-4">
                    <Link href="/member" className="hover:underline hover:text-amber-950 transition-colors duration-200">
                      Become a Sponsor
                    </Link>
                  </li>
                  <li className="mb-4">
                    <Link href="/more-about-us" className="hover:underline hover:text-amber-950 transition-colors duration-200">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <a href="tel:+12423288477" className="hover:underline hover:text-amber-950 transition-colors duration-200">
                      Tip Hotline: 328-TIPS
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="mb-6 text-sm font-semibold text-amber-900 uppercase">
                  More
                </h2>
                <ul className="text-amber-800/80">
                  <li className="mb-4">
                    <Link href="/contact" className="hover:underline hover:text-amber-950 transition-colors duration-200">
                      Contact Us
                    </Link>
                  </li>
                  <li className="mb-4">
                    <a href="https://play.google.com/store/apps/details?id=com.anonymous.CrackCrimeBahamas" target="_blank" rel="noopener" className="hover:underline hover:text-amber-950 transition-colors duration-200">
                      Get the App
                    </a>
                  </li>
                  <li>
                    <Link href="/login" className="hover:underline hover:text-amber-950 transition-colors duration-200">
                      Admin Login
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="mb-6 text-sm font-semibold text-amber-900 uppercase">
                  Legal
                </h2>
                <ul className="text-amber-800/80">
                  <li className="mb-4">
                    <Link href="/legal/privacy" className="hover:underline hover:text-amber-950 transition-colors duration-200">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal/terms" className="hover:underline hover:text-amber-950 transition-colors duration-200">
                      Terms &amp; Conditions
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <hr className="my-6 border-amber-900/15 sm:mx-auto lg:my-8" />
          <div className="sm:flex sm:items-center sm:justify-between">
            <span className="text-sm text-amber-800/70 sm:text-center">
              © {year}{" "}
              <Link href="/" className="hover:underline hover:text-amber-950 transition-colors duration-200">
                CrackCrimeBahamas™
              </Link>
              . All Rights Reserved.
            </span>
            <div className="flex mt-4 space-x-6 sm:justify-center sm:mt-0">
              <a
                href="https://www.crimestoppersbahamas.com/"
                target="_blank"
                rel="noopener"
                className="text-amber-700/70 hover:text-amber-950 transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 20 20"
                  className="w-5 h-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill="#6f6d6d"
                    d="M10 5.487a1 1 0 0 0-1.591-.806l-5.88 4.311a1.25 1.25 0 0 0 0 2.016l5.88 4.312A1 1 0 0 0 10 14.514v-3.16l5.409 3.966A1 1 0 0 0 17 14.514V5.487a1 1 0 0 0-1.591-.806L10 8.647zm-1.59-.806l.293.399Z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
