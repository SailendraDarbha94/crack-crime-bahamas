"use client";

import { useState } from "react";

const Page = () => {
  const [message, setMessage] = useState<string>("");

  const fetchData = async () => {
    const res = await fetch("/api/message");
    const data = await res.json();
    console.log(data);
  };

  const postData = async () => {
    const res = await fetch("/api/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
      }),
    });
    const data = await res.json()
    if(data){
        setMessage("")
    }
    console.log(data)
  };
  return (
    <div className="min-h-screen w-full p-4 md:p-14 lg:p-24">
      <h1 className="text-4xl mb-2 font-nunito">Admin Dashboard</h1>
      <h1 className="text-2xl mt-2 font-nunito">Page Under Construction</h1>
      <a
        href="/"
        className="font-nunito mt-8 block w-40 text-center bg-blue-700 text-white rounded-lg p-2"
      >
        Go Home
      </a>
      <div className="mt-20 font-nunito text-lg">
        <h1 className="underline text-xl mb-10">Testing Apis</h1>
        <button
          className="w-40 block my-4 text-center rounded-lg bg-blue-700 text-white"
          onClick={fetchData}
        >
          Fetch
        </button>
        <hr />
        <div className="mt-10">
          <label htmlFor="message">Message</label>
          <input value={message} type="text" name="message" id="message" className="mx-4 rounded-lg text-black p-2 focus:outline-none" onChange={e => setMessage(e.target.value)} />
        </div>
        <button
          className="w-40 block my-4 text-center rounded-lg bg-blue-700 text-white"
          onClick={postData}
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default Page;
