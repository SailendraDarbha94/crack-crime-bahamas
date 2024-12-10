"use client";
import Donation from "@/components/Donation";
import { ToastContext } from "@/lib/toastContext";
import { Button, Link } from "@nextui-org/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useContext } from "react";

export default function Home() {
  const router = useRouter();
  const appDownloader = () => {
    setTimeout(() => {
      window.open(
        "https://play.google.com/store/apps/details?id=com.anonymous.CrackCrimeBahamas",
        "_blank"
      );
    }, 300);
  };

  const { toast } = useContext(ToastContext);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24">
      <h1 className="md:text-6xl lg:text-8xl text-4xl font-nunito font-extrabold mb-10 w-screen text-center">
        Crack Crime Bahamas
      </h1>
      <section className="bg-white dark:bg-gray-900 rounded-lg font-nunito mb-10 w-full">
        <div className="grid w-full px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
          <div className="mr-auto place-self-center lg:col-span-7">
            <h1 className="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-3xl xl:text-5xl dark:text-white">
              Crime Stoppers Bahamas
            </h1>
            <p className="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">
              The worst amongst us have no chance of perpetrating any criminal
              acts if the the rest of us come together.
            </p>
            <Button
              onPress={appDownloader}
              radius="sm"
              className="mr-1 bg-gradient-to-t from-amber-200 shadow-sm to-yellow-500 text-gray-900 hover:text-black shadow-black font-nunito font-bold text-lg"
            >
              Download App
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g fill="currentColor">
                  <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                  <path d="M8 14a1 1 0 1 0 0-2a1 1 0 0 0 0 2" />
                </g>
              </svg>
            </Button>
            {/* <Button
              color="secondary"
              radius="sm"
              variant="solid"
              className="mr-2 p-0"
            >
              <Link
                isExternal={true}
                className="text-white hover:text-green-500 px-4 py-2"
                //color="foreground"
                href=""
                //target="_blank"
              >
                Download App
                <svg
                  className="w-5 h-5 ml-1 -mr-1"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g fill="currentColor">
                    <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                    <path d="M8 14a1 1 0 1 0 0-2a1 1 0 0 0 0 2" />
                  </g>
                </svg>
              </Link>
            </Button> */}
            <Button
              onPress={() => {
                //toast({ type: "success", message: "something to see" });
                setTimeout(() => {
                  router.push("/more-about-us");
                }, 300);
              }}
              radius="sm"
              className="ml-1 bg-gradient-to-tr hover:bg-gradient-to-b hover:from-yellow-500 hover:to-amber-200 shadow-sm from-violet-500 to-blue-500 text-white hover:text-black shadow-black font-nunito font-bold text-lg"
            >
              More About Us
            </Button>
            {/* <a
              href=""
              className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
            >
              More About Us
            </a> */}
          </div>
          <div className="hidden lg:mt-0 lg:col-span-5 lg:flex relative">
            {/* <Image
              src="/landingPageTop.jpg"
              fill
              alt="mockup"
              className="dark:rounded-lg"
            /> */}
            <img
              src="/newfavicon.png"
              alt="logo image"
              className="max-h-80 mx-auto"
            />
          </div>
        </div>
      </section>
      <section className="bg-white dark:bg-gray-900 rounded-lg font-nunito mb-10">
        <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
          <div className="max-w-screen-md mb-8 lg:mb-16">
            <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
              Features of our App
            </h2>
            <p className="text-gray-500 sm:text-xl dark:text-gray-400">
              We here at Crack Crime Bahamas believe that safety is one of the
              fundamental human rights and are steadfast in our commitment to
              keeping our communities safe.
            </p>
          </div>
          <div className="space-y-8 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-12 md:space-y-0">
            <div>
              <div className="flex justify-center items-center mb-4 w-10 h-10 rounded-full bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 20 24"
                >
                  <path
                    fill="currentColor"
                    d="m8.312 22.15l1.385-6.461l-1.385-1.846l-1.846-.923zm3.692 0l1.846-9.229l-1.846.923l-1.385 1.846zm2.307-14.565a.357.357 0 0 0-.058-.087a3.904 3.904 0 0 0-1.401-.114l.016-.001a12.92 12.92 0 0 0-2.493.29l.084-.015a1.59 1.59 0 0 1-.616-.001l.01.002a12.347 12.347 0 0 0-2.396-.274h-.013a4.027 4.027 0 0 0-1.413.121l.028-.006a.346.346 0 0 0-.057.084l-.001.002q.029.26.058.39c.03.038.065.069.106.093l.002.001a.258.258 0 0 1 .108.149v.002c.034.075.07.174.102.274l.006.022q.08.24.101.296t.108.245c.044.1.085.18.129.258l-.007-.013q.036.058.13.202a.65.65 0 0 0 .171.193l.002.001q.08.05.202.137a.687.687 0 0 0 .248.114l.005.001q.13.029.296.058c.103.018.222.029.344.029h.011h-.001l.07.001c.284 0 .553-.067.791-.186l-.01.005c.197-.098.356-.246.466-.428l.003-.005c.08-.142.151-.307.204-.479l.005-.018c.047-.164.103-.305.172-.439l-.006.013a.283.283 0 0 1 .252-.18h.174a.282.282 0 0 1 .252.178l.001.002c.062.12.119.262.161.409l.004.017c.058.191.129.356.215.51l-.007-.013c.112.187.272.335.462.43l.006.003c.228.114.497.181.781.181c.025 0 .049 0 .074-.002h-.003h.01c.121 0 .24-.01.356-.031l-.012.002q.166-.029.296-.058a.71.71 0 0 0 .255-.117l-.002.001q.122-.086.202-.137a.648.648 0 0 0 .171-.191l.002-.003q.094-.144.13-.202c.038-.065.079-.145.115-.227l.007-.017q.086-.187.108-.245t.101-.296c.038-.122.074-.221.116-.316l-.008.02a.256.256 0 0 1 .107-.151l.001-.001a.37.37 0 0 0 .107-.093l.001-.001a3.17 3.17 0 0 0 .059-.376l.001-.014zm5.999 12.676A3.575 3.575 0 0 1 19.257 23a3.891 3.891 0 0 1-2.809.995h.009H3.855a3.888 3.888 0 0 1-2.803-.998l.004.003a3.575 3.575 0 0 1-1.05-2.748v.009q0-.88.065-1.701c.06-.684.157-1.302.292-1.905l-.018.095a9.898 9.898 0 0 1 .565-1.847l-.024.066a5.861 5.861 0 0 1 .923-1.501l-.007.008a4.118 4.118 0 0 1 1.324-1.067l.023-.011l-1.298-3.172h3.086a5.516 5.516 0 0 1-.32-1.845v-.002q0-.173.029-.462q-2.8-.577-2.8-1.385q0-.822 3.028-1.428c.215-.748.468-1.389.773-2l-.03.067A7.561 7.561 0 0 1 6.65.518l-.01.013a1.406 1.406 0 0 1 1.095-.534c.457.054.868.213 1.22.453L8.946.444c.343.234.754.393 1.198.446l.013.001a2.715 2.715 0 0 0 1.22-.453l-.009.006a2.7 2.7 0 0 1 1.2-.446l.013-.001c.443.002.837.209 1.094.531l.002.003a7.52 7.52 0 0 1 .997 1.597l.019.047c.274.543.527 1.184.722 1.85l.021.082q3.028.606 3.028 1.428q0 .808-2.8 1.385a5.565 5.565 0 0 1-.301 2.347l.012-.039h3.086l-1.178 3.248c.631.341 1.151.81 1.541 1.377l.01.015c.415.591.74 1.282.935 2.025l.01.045c.173.612.319 1.353.411 2.111l.007.074c.073.629.114 1.358.114 2.097v.048v-.003z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Anonymity
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Helpful in stopping crime and keeping you safe
              </p>
            </div>
            <div>
              <div className="flex justify-center items-center mb-4 w-10 h-10 rounded-full bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M4.19 4.47C3.47 4.79 3 5.51 3 6.3V11c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V6.3c0-.79-.47-1.51-1.19-1.83l-7-3.11c-.52-.23-1.11-.23-1.62 0zM12 7c.55 0 1 .45 1 1s-.45 1-1 1s-1-.45-1-1s.45-1 1-1m0 4c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1s-1-.45-1-1v-4c0-.55.45-1 1-1"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Privacy
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Your data is your own and you have a right to choose what data
                you share with us and can delete it whenever you want.
              </p>
            </div>
            <div>
              <div className="flex justify-center items-center mb-4 w-10 h-10 rounded-full bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12.63 2c5.53 0 10.01 4.5 10.01 10s-4.48 10-10.01 10c-3.51 0-6.58-1.82-8.37-4.57l1.58-1.25C7.25 18.47 9.76 20 12.64 20a8 8 0 0 0 8-8a8 8 0 0 0-8-8C8.56 4 5.2 7.06 4.71 11h2.76l-3.74 3.73L0 11h2.69c.5-5.05 4.76-9 9.94-9m2.96 8.24c.5.01.91.41.91.92v4.61c0 .5-.41.92-.92.92h-5.53c-.51 0-.92-.42-.92-.92v-4.61c0-.51.41-.91.91-.92V9.23c0-1.53 1.25-2.77 2.77-2.77c1.53 0 2.78 1.24 2.78 2.77zm-2.78-2.38c-.75 0-1.37.61-1.37 1.37v1.01h2.75V9.23c0-.76-.62-1.37-1.38-1.37"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Encryption
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                We encrypt any messages you send from our App hence it is not
                prone to hackers and eliminates personal risk.
              </p>
            </div>
            <div>
              <div className="flex justify-center items-center mb-4 w-10 h-10 rounded-full bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 32 32"
                >
                  <path
                    fill="currentColor"
                    d="M26 14h-2v2h2a3.003 3.003 0 0 1 3 3v4h2v-4a5.006 5.006 0 0 0-5-5M24 4a3 3 0 1 1-3 3a3 3 0 0 1 3-3m0-2a5 5 0 1 0 5 5a5 5 0 0 0-5-5m-1 28h-2v-2a3.003 3.003 0 0 0-3-3h-4a3.003 3.003 0 0 0-3 3v2H9v-2a5.006 5.006 0 0 1 5-5h4a5.006 5.006 0 0 1 5 5zm-7-17a3 3 0 1 1-3 3a3 3 0 0 1 3-3m0-2a5 5 0 1 0 5 5a5 5 0 0 0-5-5m-8 3H6a5.006 5.006 0 0 0-5 5v4h2v-4a3.003 3.003 0 0 1 3-3h2zM8 4a3 3 0 1 1-3 3a3 3 0 0 1 3-3m0-2a5 5 0 1 0 5 5a5 5 0 0 0-5-5"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">Events</h3>
              <p className="text-gray-500 dark:text-gray-400">
                We also conduct events as part of our ongoing efforts in
                community building, thus you shall not feel alone in fighting
                crime.
              </p>
            </div>
            <div>
              <div className="flex justify-center items-center mb-4 w-10 h-10 rounded-full bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12 2C6.486 2 2 6.486 2 12v4.143C2 17.167 2.897 18 4 18h1a1 1 0 0 0 1-1v-5.143a1 1 0 0 0-1-1h-.908C4.648 6.987 7.978 4 12 4s7.352 2.987 7.908 6.857H19a1 1 0 0 0-1 1V18c0 1.103-.897 2-2 2h-2v-1h-4v3h6c2.206 0 4-1.794 4-4c1.103 0 2-.833 2-1.857V12c0-5.514-4.486-10-10-10"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Support
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                We strive to provide support to the most vulnerable amongst us
                and you can contact us anytime of the day.
              </p>
            </div>
            <div>
              <div className="flex justify-center items-center mb-4 w-10 h-10 rounded-full bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12 11q.825 0 1.413-.587T14 9t-.587-1.412T12 7t-1.412.588T10 9t.588 1.413T12 11m-5-.2V7H5v1q0 .95.55 1.713T7 10.8m10 0q.9-.325 1.45-1.088T19 8V7h-2zM11 19v-3.1q-1.225-.275-2.187-1.037T7.4 12.95q-1.875-.225-3.137-1.637T3 8V7q0-.825.588-1.412T5 5h2q0-.825.588-1.412T9 3h6q.825 0 1.413.588T17 5h2q.825 0 1.413.588T21 7v1q0 1.9-1.263 3.313T16.6 12.95q-.45 1.15-1.412 1.913T13 15.9V19h3q.425 0 .713.288T17 20t-.288.713T16 21H8q-.425 0-.712-.288T7 20t.288-.712T8 19z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Rewards
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Heroic deeds should be incentivized and motivated hence we have
                a rewards programme for helpful information that leads to an
                arrest
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white dark:bg-gray-900 rounded-lg font-nunito mb-10">
        <div className="gap-16 items-center py-8 px-4 mx-auto max-w-screen-xl lg:grid lg:grid-cols-2 lg:py-16 lg:px-6">
          <div className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
            <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
              Meet the Team
            </h2>
            <p className="mb-4">
              Marisa Ahwai is the current chairman and stands on the shoulders
              of the principals who had the vision to see the need for public
              police partnership in solving crime in 2001, started the program
              under the umbrella of Crime Stoppers International.
            </p>
            <p>
              We are a Non Governmental Organisation and we depend on donations,
              membership and corporate sponsors to help keep the program
              running. Please consider making a
              <Donation />
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="relative">
              {" "}
              <Image
                className="w-full rounded-lg"
                src="/marisa.jpeg"
                fill={true}
                alt="founder of crime stoppers bahamas"
              />
            </div>
            <img
              className="mt-4 w-full lg:mt-10 rounded-lg"
              src="/newfavicon.png"
              alt="office content 2"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
