"use client";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-wrap">
      <div className="w-full my-8 p-4 flex flex-wrap h-fit">
        <div className="w-full md:w-1/2 p-2">
          <Image
            className="mx-auto"
            src="/newfavicon.png"
            width={320}
            height={240}
            alt="logo"
          />
        </div>
        <div className="w-full md:w-1/2 p-2">
          <h2 className="text-2xl font-extrabold mb-4 tracking-wide">
            Help Combating Crime by Reporting What You See, What You Know
          </h2>
          <p className="text-lg tracking-wide">
            Our initiative helps you protect your friends and loved ones and
            makes your community that much more safer. We have a mission bigger
            than ourselves and would love to see a safer world, which can only
            be realised by individual adction at grassroots level.
          </p>
        </div>
      </div>
    </div>
  );
}
