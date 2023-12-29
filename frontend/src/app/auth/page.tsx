"use client";

import { validator } from "@/lib/utils";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";

const Page = () => {
    const router = useRouter()
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const checkAuth = async () => {
    if (!username || !password) {
      return false;
    }
    const res = await validator(username, password);
    if (!res) {
      alert("Invalid username or password");
    }

    if (res == true) {
        router.push('/admin');
    }
  };

  return (
    <div className="flex min-h-screen justify-center items-center">
      <div className="bg-white text-black rounded-lg m-2 p-2">
        <div className="m-2 p-2 flex justify-between">
          <label className="label" htmlFor="salary">
            Username
          </label>
          <input
            type="text"
            className="rounded-md border-2 border-black"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="m-2 p-2 flex justify-between">
          <label className="label" htmlFor="salary">
            Password
          </label>
          <input
            type="password"
            className="rounded-md border-2 border-black"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex justify-center">
          <button className="rounded-md bg-blue-700 text-white m-2 p-2" onClick={checkAuth}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page;
