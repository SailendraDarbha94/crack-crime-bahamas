"use client";
import Image from "next/image";
import type { Metadata } from "next";
import ExpandingTriangles from "@/components/ui/ExpandingTriangles";
import { Button, Divider } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import BasicCard from "@/components/BasicCard";
import NavBarCallLink from "@/components/NavBarCallLink";
export interface CardProps {
  id: number;
  url: string;
  alt: string;
  text: string;
  btn: string;
}

export default function Home() {
  const toggleButton = (el: any) => {
    console.log(el);
    //console.log(buttonRef.current?.id)
  };

  const [quote, setQuote] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  const [navbarHeight, setNavbarHeight] = useState<string>("h-14");
  const url = "https://api.api-ninjas.com/v1/quotes?category=courage";
  const fetchQuote = async () => {
    try {
      const res = await fetch(url, {
        headers: {
          "X-Api-Key": process.env.NEXT_PUBLIC_NINJA_KEY!,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      console.log(data[0]);
      setQuote(data[0].quote);
      setAuthor(data[0].author);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const cards: CardProps[] = [
    {
      id: 1,
      url: "/plum.png",
      alt: "plums",
      text: "Are you Suspicious?",
      btn: "Post a Tip",
    },
    {
      id: 2,
      url: "/lemon.png",
      alt: "lemons",
      text: "Crime Prevention",
      btn: "Learn More",
    },
    {
      id: 3,
      url: "/strawberry.png",
      alt: "strawberries",
      text: "Safety Tips",
      btn: "Read More",
    },
    {
      id: 4,
      url: "/tomato.png",
      alt: "tomatoes",
      text: "Report a Crime",
      btn: "Report Now",
    }
  ];

  const toggleNavbar = () => {
    if (navbarHeight === "h-14") {
      setNavbarHeight("h-4/6");
    } else {
      setNavbarHeight("h-14");
    }
  };
  return (
    <main className="flex min-h-screen w-full max-w-screen flex-col p-4 md:p-24">
      <div>
        <h1 className="text-3xl md:text-6xl font-bold text-blue-900">
          Welcome to Crack-Crime-Bahamas
        </h1>
        <p className="mt-4 md:ml-3 text-md mb-4">Your safety is our Priority</p>
      </div>
      {/* <div className="w-full">
        <Image
          src="/homepagetop.png"
          className="rounded-lg mt-10"
          alt="CrackCrimeBahamas Logo"
          width={1920}
          height={1080}
        />
      </div> */}
      <Divider />
      <div className="w-full my-4">
        <pre className="text-wrap italic font-semibold">
          {quote ? quote : ""}
        </pre>
        <pre className="text-right">{author ? "-" + author : ""}</pre>
      </div>
      <Divider />
      <div className="flex w-fullmin-h-fit flex-wrap justify-evenly items-center">
        {cards.map((card: any, index: number) => {
          return (
              <BasicCard key={card.id} {...card} />
          );
        })}
      </div>
      <div
        className={`min-w-screen flex flex-col w-full z-50 transition-height fixed bottom-0 left-0 bg-slate-300 p-2 hover:cursor-pointer ${navbarHeight}`}
      >
        <Button
          radius="full"
          className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg mx-auto"
          onPress={toggleNavbar}
        >
          {navbarHeight === "h-14" ? "Show More" : "Show Less"}
        </Button>
        <div
          className={`${
            navbarHeight === "h-14" ? "hidden" : "block"
          } flex flex-col`}
        >
          <NavBarCallLink title="Emergency" number="911" />
          <NavBarCallLink title="Family Islands" number="242-300-8477" />
          <NavBarCallLink title="Nassau" number="328-8477" />
          <NavBarCallLink title="Help" number="919" />
        </div>
      </div>
    </main>
  );
}
