"use client";
import NavBarCallLink from "@/components/NavBarCallLink";
import { Button, NextUIProvider } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Client({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [navbarHeight, setNavbarHeight] = useState<string>("h-14");
  const toggleNavbar = () => {
    if (navbarHeight === "h-14") {
      setNavbarHeight("h-4/6");
    } else {
      setNavbarHeight("h-14");
    }
  };
  return (
    <NextUIProvider>
      <div>
        {children}
        <div
          className={`min-w-screen flex flex-col w-full z-50 transition-height fixed bottom-0 left-0 bg-gradient-to-tr from-teal-50 to-teal-400 p-2 hover:cursor-pointer ${navbarHeight}`}
        >
          <div className="flex justify-between w-full">
            <Button
              radius="full"
              className={`bg-gradient-to-tr from-purple-400 to-blue-900 text-white shadow-lg mx-auto ${navbarHeight === "h-14" ? "hidden" : "block"}`}
              onPress={() => {router.push("/"), toggleNavbar()}}
            >
              Home
            </Button>
            <Button
              radius="full"
              className="bg-gradient-to-tr from-green-500 to-green-900 text-white font-semibold shadow-lg mx-auto"
              onPress={toggleNavbar}
            >
              {navbarHeight === "h-14" ? "Expand" : "Collapse"}
            </Button>
            <Button
              radius="full"
              className={`bg-gradient-to-tr from-gray-500 to-gray-900 text-white shadow-lg mx-auto ${navbarHeight === "h-14" ? "hidden" : "block"}`}
              onPress={() => window.open("https://www.royalbahamaspolice.org/", "_blank")}
            >
              Police
            </Button>
          </div>
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
      </div>
    </NextUIProvider>
  );
}
