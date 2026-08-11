import Modal from "./Modal";

export default function Footer() {
  return (
    <div className="w-full">
      <footer className="p-4 bg-white/15 backdrop-blur-md border-t border-white/40 sm:p-6">
        <div className="mx-auto max-w-screen-xl">
          <div className="md:flex md:justify-between">
            <div className="mb-6 md:mb-0">
              <a href="/" className="flex items-center">
                <img src="/newfavicon.png" className="mr-3 h-8" alt="Logo" />
                <span className="self-center text-2xl font-semibold whitespace-nowrap text-amber-950">
                  CrackCrimeBahamas
                </span>
              </a>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
              <div>
                <h2 className="mb-6 text-sm font-semibold text-amber-900 uppercase">
                  Resources
                </h2>
                <ul className="text-amber-800/80">
                  <li className="mb-4">
                    <a
                      rel="noopener"
                      href="https://www.royalbahamaspolice.org/crimeprevention/"
                      target="_blank"
                      className="hover:underline hover:text-amber-950 transition-colors duration-200"
                    >
                      Crime Prevention Tips
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.royalbahamaspolice.org/community/announcements/"
                      className="hover:underline hover:text-amber-950 transition-colors duration-200"
                      target="_blank"
                      rel="noopener"
                    >
                      Announcements
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
                    <a href="/login" className="hover:underline ">
                      Admin Login
                    </a>
                  </li>
                  <li>
                    <Modal
                      word="Contact Us"
                      heading="Get In Touch With Us"
                      content="1-242-322-3320,crimestoppersbahamas@gmail.com"
                    />
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="mb-6 text-sm font-semibold text-amber-900 uppercase">
                  Legal
                </h2>
                <ul className="text-amber-800/80">
                  <li className="mb-4">
                    <a href="/legal/privacy" className="hover:underline hover:text-amber-950 transition-colors duration-200">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="/legal/terms" className="hover:underline hover:text-amber-950 transition-colors duration-200">
                      Terms &amp; Conditions
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <hr className="my-6 border-amber-900/15 sm:mx-auto lg:my-8" />
          <div className="sm:flex sm:items-center sm:justify-between">
            <span className="text-sm text-amber-800/70 sm:text-center">
              © 2024{" "}
              <a href="/" className="hover:underline hover:text-amber-950 transition-colors duration-200">
                CrackCrimeBahamas™
              </a>
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
