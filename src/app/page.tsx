"use client";
import Nav from "@/components/Nav";
import { INTROTEXT } from "@/constants/data";
import { supabase } from "@/lib/supabase";
import { Button } from "@nextui-org/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  // const handleClick = async () => {
  //   console.log("jamie dimon");
  // };

  return (
    <main className="flex flex-col items-center justify-between px-4 pt-4 pb-20 bg-transparent w-[99%] mx-auto shadow-lg rounded-lg">
      <div className="flex w-full flex-wrap min-h-fit">
        <Image
          src="/toothless.png"
          alt="doctor"
          className="rounded-lg w-full md:w-1/3 p-2 max-h-96"
          width={100}
          height={100}
        />
        <div className="w-full md:w-2/3 p-2">
          <h1 className="text-2xl text-center font-extrabold">
            The #1 Platform for Dentists in the Internet Era
          </h1>
          <div className="w-full p-2">
            <p className="w-full tracking-wide text-xl">{INTROTEXT}</p>
            <ul className="">
              <li className="text-lg shadow-md rounded-md p-2">If you're a Dentist looking for a new Job or connect with other dentists you can searh for them</li>
              <li className="text-lg shadow-md rounded-md p-2">If you're a Clinic-Owner, you can post a job in your clinic or collaborate with other clinic owners</li>
            </ul>
            <div className="w-full flex flex-col items-center justify-between">
              <div className="flex flex-col items-center text-justify">
                <pre className="font-semibold text-lg m-2 p-2">
                  Hello there, Dr! <br />
                  Let us simplify your life
                </pre>
                <Button
                  as={Link}
                  color="primary"
                  href="/auth"
                  variant="flat"
                  className="max-w-40"
                >
                  Create Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="flex w-full justify-center bg-gradient-to-b from-zinc-200 backdrop-blur-2xl  lg:rounded-xl lg:border lg:bg-gray-700 lg:p-4 lg:dark:bg-zinc-800/30">
          Get started by editing&nbsp;
          <code className="font-mono font-bold">src/app/page.tsx</code>
        </p>
        
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{" "}
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              className="dark:invert"
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div> */}

      {/* <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        />
      </div> */}

      {/* <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <a
          href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Docs{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Find in-depth information about Next.js features and API.
          </p>
        </a>

        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Learn{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Learn about Next.js in an interactive course with&nbsp;quizzes!
          </p>
        </a>



        <a
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Deploy{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Instantly deploy your Next.js site to a shareable URL with Vercel.
          </p>
        </a>
      </div> */}
      <div className="hidden mt-10 md:grid text-justify lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4">
        <a
          href="#"
          className="group col-span-2 hover:cursor-crosshair rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Dentist Looking for a Job{" ?"}
            {/* <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span> */}
          </h2>
          <p className={`m-0 text-sm opacity-50`}>
            We've got you covered with <span className="underline font-semibold">Part-Time</span>,  <span className="underline font-semibold">Full-Time</span> and  <span className="underline font-semibold">Contract</span> Based Opportunities as well
          </p>
        </a>
        <a
          href="#"
          className="group col-span-2 hover:cursor-crosshair rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Own a Clinic{" ?"}
            {/* <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span> */}
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Explore starter templates for Next.js.
          </p>
        </a>
      </div>
    </main>
  );
}
