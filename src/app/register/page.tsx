"use client";

import { Button, Input } from "@nextui-org/react";
import { emitWarning } from "process";
import { useState } from "react";

export default function page() {
  const [client, setClient] = useState<any>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setClient((prevValue: any) => {
      return {
        ...prevValue,
        [name]: value,
      };
    });
  };

  function validateEmail() {
    console.log(client);
    const re: any =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    console.log(re.test(client.email));
    return re.test(client.email);
  }

  return (
    <main className="flex flex-col min-h-screen items-center justify-between p-4 bg-transparent w-[99%] mx-auto shadow-lg rounded-lg">
      hello world
    </main>
  );
}
