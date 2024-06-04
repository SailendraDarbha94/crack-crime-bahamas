"use client";

import { useState } from "react";

const Expandable = ({
  heading,
  initialContent,
  moreContent,
}: {
  heading: string;
  initialContent: string;
  moreContent: string;
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <section className="bg-white dark:bg-gray-900 rounded-lg my-8">
      <div className="py-8 px-4">
        <div id="initial-content" className="">
          <h2 className="mb-4 text-3xl md:text-4xl tracking-tight font-bold font-nunito text-center text-blue-500">{heading}</h2>
          <p className="font-medium font-nunito text-lg tracking-wide">{initialContent}</p>
          {isExpanded ? null : (
            <button
              onClick={handleToggle}
              className="inline-flex items-center font-medium bg-slate-200 mt-4 rounded-xl py-2 pl-4 pr-2 text-black"
            >
              Learn more
              <svg
                className="ml-1 w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          )}
        </div>
        <div
          id="more-content"
          className={`transition-max-height duration-700 font-nunito font-medium text-lg ease-in-out overflow-hidden ${
            isExpanded ? "max-h-screen" : "max-h-0"
          }`}
        >
          <p className="mb-4 font-medium font-nunito text-lg tracking-wide">{moreContent}</p>
        </div>
      </div>
    </section>
  );
};

export default Expandable;
