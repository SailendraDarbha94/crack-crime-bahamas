/* eslint-disable @next/next/no-img-element */
"use client";
import Image from "next/image";
import type { Metadata } from "next";
import ExpandingTriangles from "@/components/ui/ExpandingTriangles";
import { Button, Divider } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import BasicCard from "@/components/BasicCard";
import bg from "../../public/advert.jpeg";
import NavBarCallLink from "@/components/NavBarCallLink";

export interface CardProps {
  id: number;
  url: string;
  route: string;
  alt: string;
  text: string;
  btn: string;
}

export default function Home() {
  const toggleButton = (el: any) => {
    console.log(el);
    //console.log(buttonRef.current?.id)
  };

  
  


  const fetchRes = async () => {
    const res = await fetch('/api/test')
    const { data } = await res.json()
    
    console.log(data)
  }
  useEffect(() => {
    fetchRes()
  },[])

  const [quote, setQuote] = useState<string>("");
  const [author, setAuthor] = useState<string>("");

  // const url = "https://api.api-ninjas.com/v1/quotes?category=courage";
  // const fetchQuote = async () => {
  //   try {
  //     const res = await fetch(url, {
  //       headers: {
  //         "X-Api-Key": process.env.NEXT_PUBLIC_NINJA_KEY!,
  //         "Content-Type": "application/json",
  //       },
  //     });
  //     const data = await res.json();
  //     console.log(data[0]);
  //     setQuote(data[0].quote);
  //     setAuthor(data[0].author);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  // useEffect(() => {
  //   fetchQuote();
  // }, []);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const cards: CardProps[] = [
    {
      id: 1,
      url: "/plum.png",
      alt: "plums",
      text: "Are you Suspicious?",
      btn: "Post a Tip",
      route: "/how-it-works",
    },
    {
      id: 2,
      url: "/lemon.png",
      alt: "lemons",
      text: "How it Works",
      btn: "Learn More",
      route: "/how-it-works",
    },
    {
      id: 3,
      url: "/strawberry.png",
      alt: "strawberries",
      text: "Safety Tips",
      btn: "Read More",
      route: "/safety-tips",
    },
    {
      id: 4,
      url: "/tomato.png",
      alt: "tomatoes",
      text: "Mission & Vision",
      btn: "Read Now",
      route: "/mission-vision",
    },
  ];

  return (
    <main className="flex min-h-screen w-full max-w-screen flex-col md:p-24">
      <div className="">
        <img
          src="/homepagetop.png"
          alt="citizens standing together"
          className="w-full"
        />
        {/* <h1 className="text-3xl md:text-6xl font-bold text-blue-900">
          Welcome to Crack-Crime-Bahamas
        </h1>
        <p className="mt-4 md:ml-3 text-md mb-4">Your safety is our Priority</p> */}
      </div>
      <h1 className="text-3xl text-center font-bold py-2">CrackCrimeBahamas</h1>
      <Divider />
      {/* <div
        className="w-full h-40"
        style={{
          backgroundImage: `url(${bg.src})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      ></div> */}
      {/* <div className="w-full p-4">
        <pre className="text-wrap italic font-semibold">
          {quote ? quote : ""}
        </pre>
        <pre className="text-right text-wrap">{author ? "-" + author : ""}</pre>
      </div> */}
      <Divider />
      <div className="flex w-full min-h-fit flex-wrap bg-slate-300 items-center">
        <div className="bg-red-100 h-40 flex justify-center items-center w-1/2 md:w-1/3">
          <img
            src="/tiles/tip.jpeg"
            alt="missing persons list"
            className="w-full h-full"
          />
        </div>
        <div className="bg-teal-300 h-40 flex justify-center items-center w-1/2 md:w-1/3">
          <h1 className="text-2xl font-semibold">Who We Are</h1>
        </div>
        <div className="bg-red-400 h-40 flex justify-center items-center w-1/2 md:w-1/3">
          <img
            src="/tiles/wanted.jpeg"
            alt="missing persons list"
            className="w-full h-full"
          />
        </div>
        <div className="bg-red-900 h-40 flex justify-center items-center w-1/2 md:w-1/3">
          <img
            src="/tiles/help.jpeg"
            alt="missing persons list"
            className="w-full h-full"
          />
        </div>
        <div className="bg-red-50 h-40 flex justify-center items-center w-1/2 md:w-1/3">
          <img
            src="/tiles/missing.jpeg"
            alt="missing persons list"
            className="w-full h-full"
          />
        </div>
        <div className="bg-red-300 h-40 flex justify-center items-center w-1/2 md:w-1/3">
          <img
            src="/tiles/emergency.jpeg"
            alt="missing persons list"
            className="w-full h-full"
          />
        </div>
        {/* {cards.map((card: any, index: number) => {
          return (
              <BasicCard key={card.id} {...card} />
          );
        })} */}
      </div>
    </main>
  );
}
