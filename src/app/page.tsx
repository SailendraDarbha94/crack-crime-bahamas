"use client";
import Image from "next/image";
import type { Metadata } from "next";
import ExpandingTriangles from "@/components/ui/ExpandingTriangles";
import { Button, Divider } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import BasicCard from "@/components/BasicCard";

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
  },[]);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const cards:any = [
    {
      id: 1,
      title: "Report a Crime",
      subtitle: "Report a crime anonymously",
      description: "Report a crime anonymously",
      urllink: "/report",
      urltext: "Report a Crime"
    },
    {
      id: 2,
      title: "Crime Statistics",
      subtitle: "View Crime Statistics",
      description: "View Crime Statistics",
      urllink: "/statistics",
      urltext: "Crime Statistics"
    },
    {
      id: 3,
      title: "Crime Prevention",
      subtitle: "Crime Prevention Tips",
      description: "Crime Prevention Tips",
      urllink: "/prevention",
      urltext: "Crime Prevention"
    }
  ]

  const toggleNavbar = () => {
    if(navbarHeight === "h-14") {
      setNavbarHeight("h-4/6")
    } else {
      setNavbarHeight("h-14")
    }
  }
  return (
    <main className="flex min-h-screen w-full max-w-screen flex-col p-4 md:p-24">
      <div>
        <h1 className="text-3xl md:text-6xl font-bold text-blue-900">
          Welcome to CrackCrimeBahamas
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
        <pre className="text-wrap italic font-semibold">{quote ? quote : ""}</pre>
        <pre className="text-right">{author ? "-" + author : ""}</pre>
      </div>
      <Divider />
      <div className="flex w-full bg-lime-300 flex-wrap items-center">
        {cards.map((card:any, index:number) => {
          return (
            <div className="lg:w-2/6 md:w-3/6 w-5/6 mx-auto" key={card.id}>
              <BasicCard {...card} />
            </div>
          )
        })}
      </div>
      <div className={`min-w-screen w-full z-50 transition-height fixed bottom-0 left-0 bg-slate-300 p-2 hover:cursor-pointer ${navbarHeight}`} onClick={toggleNavbar}>
        navbar
      </div>
    </main>
  );
}
