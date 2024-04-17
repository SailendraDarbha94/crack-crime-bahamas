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


  return (
    <main className="flex min-h-screen w-full max-w-screen flex-col md:p-24">
      <div className="">
        <img
          src="/advert.jpeg"
          alt="citizens standing together"
          className="w-full"
        />
        {/* <h1 className="text-3xl md:text-6xl font-bold text-blue-900">
          Welcome to Crack-Crime-Bahamas
        </h1>
        <p className="mt-4 md:ml-3 text-md mb-4">Your safety is our Priority</p> */}
      </div>
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
        <div className="bg-teal-100 h-40 flex justify-center items-center w-1/2 md:w-1/3">
            <h1 className="text-2xl font-semibold">The Program</h1>
        </div>
        <div className="bg-red-300 h-40 flex justify-center items-center w-1/2 md:w-1/3">
          <img
            src="/tiles/howitworks.jpeg"
            alt="missing persons list"
            className="w-full h-full"
          />
        </div>
        <div className="bg-red-400 h-40 flex justify-center items-center w-1/2 md:w-1/3">
          <img
            src="/tiles/support.jpeg"
            alt="missing persons list"
            className="w-full h-full"
          />
        </div>
        <div className="bg-teal-200 h-40 flex justify-center items-center w-1/2 md:w-1/3">
        <h1 className="text-2xl font-semibold">Events</h1>
        </div>
        <div className="bg-teal-300 h-40 flex justify-center items-center w-1/2 md:w-1/3">
        <h1 className="text-2xl font-semibold">Safety Tips</h1>
        </div>
        <div className="bg-red-300 h-40 flex justify-center items-center w-1/2 md:w-1/3">
          <img
            src="/tiles/mandv.jpeg"
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
