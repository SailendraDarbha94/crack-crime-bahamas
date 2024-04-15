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
  route: string
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
      route: "/how-it-works"
    },
    {
      id: 2,
      url: "/lemon.png",
      alt: "lemons",
      text: "How it Works",
      btn: "Learn More",
      route: "/how-it-works"
    },
    {
      id: 3,
      url: "/strawberry.png",
      alt: "strawberries",
      text: "Safety Tips",
      btn: "Read More",
      route: "/safety-tips"
    },
    {
      id: 4,
      url: "/tomato.png",
      alt: "tomatoes",
      text: "Mission & Vision",
      btn: "Read Now",
      route: "/mission-vision"
    }
  ];

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
    </main>
  );
}
