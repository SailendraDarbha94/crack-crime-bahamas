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
      <section className="bg-white dark:bg-gray-900 rounded-lg font-nunito mb-10">
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
            <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
              Help combat crime by reporting what you see and what you know to{" "}
              <span className="text-blue-500 underline">
                Crime Stoppers Bahamas{" "}
              </span>
            </h2>
            <p className="mb-6 font-light text-gray-500 md:text-lg dark:text-gray-400">
              Our initiative helps you protect your friends and loved ones and
              makes your community that much more safer. We have a mission
              bigger than ourselves and would love to see you join us.
            </p>
            <a
              href="/member"
              className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
            >
              Become a Member
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
      <section className="bg-white dark:bg-gray-900 rounded-lg font-nunito mb-10">
        <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
          <h2 className="mb-8 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
            Frequently asked questions
          </h2>
          <div className="grid pt-8 text-left border-t border-gray-200 md:gap-16 dark:border-gray-700 md:grid-cols-2">
            <div>
              {frequentlyAskedQuestionsFirstBlock.map((FAQ: FAQs) => {
                return (
                  <div className="mb-10 font-nunito" key={FAQ.id}>
                    <h3 className="flex items-center mb-4 text-lg font-medium text-gray-900 dark:text-white">
                      <svg
                        className="flex-shrink-0 mr-2 w-5 h-5 text-gray-500 dark:text-gray-400"
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
                    <p className="text-gray-500 dark:text-gray-400">
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
                    <h3 className="flex items-center mb-4 text-lg font-medium text-gray-900 dark:text-white">
                      <svg
                        className="flex-shrink-0 mr-2 w-5 h-5 text-gray-500 dark:text-gray-400"
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
                    <p className="text-gray-500 dark:text-gray-400">
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
