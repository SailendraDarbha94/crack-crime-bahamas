"use client";

import app from "@/lib/firebase";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Sidebar = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  const logoutUser = async () => {
    setLoading(true);
    const auth = await getAuth(app);
    try {
      await signOut(auth);
      setLoading(false);
      router.push("/");
    } catch (err) {
      setLoading(false);
      console.log(JSON.stringify(err));
    }
  };

  return (
    <div className="w-full p-2 h-full flex flex-col bg-amber-500 rounded-md shadow-xl shadow-amber-700">
      <a
        href="/"
        className="flex items-center justify-center bg-inherit my-2 text-center rounded-lg w-full font-nunito font-bold text-lg"
      >
        <img className="w-10 h-10 mr-2" src="/newfavicon.png" alt="logo" />
      </a>
      <a
        href="/admin"
        className="bg-yellow-300 my-2 text-center py-2 rounded-lg w-full font-nunito font-bold text-lg"
      >
        Home
      </a>
      <a
        href="/admin/missing"
        className="bg-yellow-300 my-2 text-center py-2 rounded-lg w-full font-nunito font-bold text-lg"
      >
        Missing +
      </a>
      <a
        href="/admin/wanted"
        className="bg-yellow-300 my-2 text-center py-2 rounded-lg w-full font-nunito font-bold text-lg"
      >
        Wanted +
      </a>
      <a
        href="/admin/member"
        className="bg-yellow-300 my-2 text-center py-2 rounded-lg w-full font-nunito font-bold text-lg"
      >
        Membership Requests
      </a>
      <button
      onClick={logoutUser}
        className="bg-red-500 text-white my-2 text-center py-2 rounded-lg w-full font-nunito font-bold text-lg"
      >
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
