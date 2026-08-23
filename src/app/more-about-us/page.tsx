"use client"
import Expandable from "@/components/Expandable";
import Image from "next/image";
import {
  AboutUsParagraphs,
  FAQs,
  frequentlyAskedQuestionsFirstBlock,
  frequentlyAskedQuestionsSecondBlock
} from "@/constants/moreAboutUsTexts";
import { aboutUsParagraphs } from "@/constants/moreAboutUsTexts";

const Page = () => {
  return (
    <div className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24">
      <section className=" rounded-lg font-nunito mb-10">
        <div className="gap-8 items-center py-8 px-4 mx-auto max-w-screen-xl xl:gap-16 md:grid md:grid-cols-2 sm:py-16 lg:px-6">
          <div className="">
            <Image
              className="mx-auto"
              src="/newfavicon.png"
              width={320}
              height={240}
              alt="logo"
            />
          </div>
          <div className="mt-4 md:mt-0">
            <h2 className="mb-4 text-3xl md:text-4xl tracking-tight font-extrabold text-amber-950">
              Help combat crime by reporting what you see and what you know to{" "}
              <a className="text-amber-800 hover:text-amber-950 underline" href="/">
                Crack Crime Bahamas{" "}
              </a>
            </h2>
            <p className="mb-6 font-light text-amber-900/80 md:text-lg">
              Our initiative helps you protect your friends and loved ones and
              makes your community that much more safer. We have a mission
              bigger than ourselves and aspire towards a world without crime, an ordeal which
              can not be realised without individual action and participation at a grassroots level.
            </p>
            <a
              href="/member"
              className="inline-flex items-center justify-center px-5 py-3 text-base font-bold text-center text-amber-950 bg-white/40 backdrop-blur-md border border-white/60 rounded-xl hover:bg-white/55 focus:ring-4 focus:ring-amber-300/50 transition-all duration-200 active:scale-95"
            >
              Become a Sponsor
            </a>
          </div>
        </div>
      </section>
      {aboutUsParagraphs.map((paragraph: AboutUsParagraphs) => {
        return (
          <Expandable
            key={paragraph.id}
            heading={paragraph.heading}
            initialContent={paragraph.initialContent}
            moreContent={paragraph.moreContent}
          />
        );
      })}
      <section className="bg-white/20 backdrop-blur-xl border border-white/50 rounded-2xl font-nunito mb-10 shadow-[0_8px_32px_rgba(120,72,10,0.12)]">
        <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
          <h2 className="mb-8 text-3xl md:text-4xl tracking-tight font-extrabold text-amber-950">
            Frequently asked questions
          </h2>
          <div className="grid pt-8 text-left border-t border-white/40 md:gap-16 md:grid-cols-2">
            <div>
              {frequentlyAskedQuestionsFirstBlock.map((FAQ: FAQs) => {
                return (
                  <div className="mb-10 font-nunito" key={FAQ.id}>
                    <h3 className="flex items-center mb-4 text-lg font-bold text-amber-950">
                      <svg
                        className="flex-shrink-0 mr-2 w-5 h-5 text-amber-700"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      {FAQ.question} ?
                    </h3>
                    <p className="text-amber-900/80">
                      {FAQ.answer}
                    </p>
                  </div>
                );
              })}
            </div>
            <div>
              {frequentlyAskedQuestionsSecondBlock.map((FAQ: FAQs) => {
                return (
                  <div className="mb-10 font-nunito" key={FAQ.id}>
                    <h3 className="flex items-center mb-4 text-lg font-bold text-amber-950">
                      <svg
                        className="flex-shrink-0 mr-2 w-5 h-5 text-amber-700"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      {FAQ.question} ?
                    </h3>
                    <p className="text-amber-900/80">
                      {FAQ.answer}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Page;
