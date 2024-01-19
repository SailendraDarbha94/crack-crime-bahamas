"use client";
import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
} from "@nextui-org/react";
import Image from "next/image";
const Nav = () => {
  return (
    <Navbar className="bg-white shadow-lg my-2 p-2 rounded-2xl mx-auto w-[99%]">
      <NavbarBrand>
        {/* <Image
          src="/faviconImage.png"
          alt="Logo"
          className="rounded-lg shadow-slate-300"
          width={50}
          height={24}
          priority
        /> */}
        {/* <p className="inline font-semibold text-xl font-mono"> */}
        <Button
          as={Link}
          color="primary"
          href="/"
          variant="ghost"
          className="flex justify-start pl-0"
        >
          <img src="/faviconImage.png" alt="logo" className="h-full w-10" />
          AYURYOJ
        </Button>
        {/* </p> */}
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Link color="foreground" href="#" className="font-semibold">
            FAQs
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="#" color="foreground" className="font-semibold">
            About Us
          </Link>
        </NavbarItem>
        {/* <NavbarItem>
          <Link color="foreground" href="#">
            Integrations
          </Link>
        </NavbarItem> */}
      </NavbarContent>
      <NavbarContent justify="end">
        {/* <NavbarItem className="">
          <Button as={Link} color="primary" href="#" variant="shadow">
            Sign Up
          </Button>
        </NavbarItem> */}
        <NavbarItem>
          <Button as={Link} color="primary" href="#" variant="shadow">
            Login
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};

export default Nav;
