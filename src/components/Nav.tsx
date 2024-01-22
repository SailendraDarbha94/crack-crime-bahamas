"use client";
import React, { useEffect, useState } from "react";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  Input,
} from "@nextui-org/react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const Nav = ({ authUser, setAuthUser }: any) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  async function handleSubmit() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (data && data.user) {
      setAuthUser(data.user);
      console.log(data);
    }
    if (error) {
      window.alert("Invalid Credentials");
      console.log(error);
    }
    if (!error) {
      onOpenChange;
      //router.push("/register");
    }
  }
  const router = useRouter();
  async function logout() {
    let { error } = await supabase.auth.signOut();
    if (!error) {
      setAuthUser(null);
      router.push("/");
    }
  }

  return (
    <Navbar className="bg-white shadow-lg my-2 p-2 rounded-2xl mx-auto w-[99%]">
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col items-center gap-1">
                Login Form
              </ModalHeader>
              <ModalBody>
                <div className="mx-auto">
                  <Input
                    className="w-80 my-2"
                    name="email"
                    value={email}
                    type="email"
                    label="Email"
                    placeholder=""
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    className="w-80 my-2"
                    name="password"
                    value={password}
                    type="password"
                    label="Password"
                    placeholder=""
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="primary"
                  onPress={onClose}
                  onClick={handleSubmit}
                  variant="flat"
                  className="mx-auto"
                >
                  Submit
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <NavbarBrand>
        <Button
          as={Link}
          color="primary"
          href="/"
          variant="shadow"
          className="flex justify-start pr-0"
        >
          {authUser ? `${authUser.email.split("@")[0]}` : "Home"}
          <img src="/faviconImage.png" alt="logo" className="h-full pl-1" />
        </Button>

        {/* </p> */}
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {authUser ? (
          authUser.role === "admin" ? (
            <NavbarItem>
              <Link
                href="/clinics"
                color="foreground"
                className="font-semibold"
              >
                Clinics List
              </Link>
            </NavbarItem>
          ) : (
            <NavbarItem>
              <Link
                href="/jobs"
                color="foreground"
                className="font-semibold"
              >
                Jobs
              </Link>
            </NavbarItem>
          )
        ) : (
          <NavbarItem>
            <Link href="#" color="foreground" className="font-semibold">
              About Us
            </Link>
          </NavbarItem>
        )}
        {authUser ? (
          <NavbarItem>
            <Link color="foreground" href="/register" className="font-semibold">
              Register Clinic
            </Link>
          </NavbarItem>
        ) : (
          <NavbarItem>
            <Link color="foreground" href="#" className="font-semibold">
              FAQs
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          {authUser ? (
            <Button onPress={logout} color="primary" href="#" variant="shadow">
              Logout
            </Button>
          ) : (
            <Button onPress={onOpen} color="primary" href="#" variant="shadow">
              Login
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};

export default Nav;
