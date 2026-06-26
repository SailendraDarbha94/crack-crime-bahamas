"use client";

import app from "@/lib/firebase";
import { ToastContext } from "@/lib/toastContext";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";

const Sidebar = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useContext(ToastContext);
  const router = useRouter();

  const logoutUser = async () => {
    setLoading(true);
    const auth = getAuth(app);
    try {
      await signOut(auth);
      setLoading(false);
      toast({
        type: "error",
        message: "User Logged Out!",
      });
      router.push("/");
    } catch (err) {
      setLoading(false);
      console.log(JSON.stringify(err));
    }
  };

  return (
    <div className="w-full h-full flex flex-col mx-2 py-2 px-3 rounded-3xl bg-amber-400/10 backdrop-blur-xl border border-amber-300/20 shadow-[0_4px_24px_rgba(217,119,6,0.15)]">
      <a
        href="/"
        className="flex items-center justify-center bg-inherit my-2 text-center rounded-lg w-full font-nunito font-bold text-lg"
      >
        <img className="w-10 h-10 mr-2" src="/newfavicon.png" alt="logo" />
      </a>
      
      <a
        href="/admin"
        className="bg-amber-400/15 backdrop-blur-sm border border-amber-300/25 text-amber-50 hover:bg-amber-400/25 hover:border-amber-200/40 transition-all duration-200 active:scale-[0.98] my-2 text-center py-2 w-full font-nunito font-bold text-lg mt-2 rounded-3xl"
      >
        Home
      </a>
      <a
        href="/admin/messages"
        className="bg-amber-400/15 backdrop-blur-sm border border-amber-300/25 text-amber-50 hover:bg-amber-400/25 hover:border-amber-200/40 transition-all duration-200 active:scale-[0.98] px-2 my-2 text-center py-2 w-full font-nunito font-bold text-lg mt-2 rounded-3xl"
      >
        Manage Messages
      </a>
      <a
        href="/admin/missing"
        className="bg-amber-400/15 backdrop-blur-sm border border-amber-300/25 text-amber-50 hover:bg-amber-400/25 hover:border-amber-200/40 transition-all duration-200 active:scale-[0.98] px-2 my-2 mt-2 text-center py-2 rounded-3xl w-full font-nunito font-bold text-lg"
      >
        Manage Missings
      </a>
      <a
        href="/admin/wanted"
        className="bg-amber-400/15 backdrop-blur-sm border border-amber-300/25 text-amber-50 hover:bg-amber-400/25 hover:border-amber-200/40 transition-all duration-200 active:scale-[0.98] px-2 my-2 mt-2 text-center py-2 rounded-3xl w-full font-nunito font-bold text-lg"
      >
        Manage Wanteds
      </a>
      {/* <a
        href="/admin/member"
        className="bg-yellow-300 dark:bg-yellow-600 my-2 text-center py-2 rounded-lg w-full font-nunito font-bold text-lg"
      >
        Membership Requests
      </a> */}
      <a
        href="/admin/adverts"
        className="bg-amber-400/15 backdrop-blur-sm border border-amber-300/25 text-amber-50 hover:bg-amber-400/25 hover:border-amber-200/40 transition-all duration-200 active:scale-[0.98] px-2 my-2 mt-2 text-center py-2 rounded-3xl w-full font-nunito font-bold text-lg"
      >
        Advertisements
      </a>
      <a
        href="/admin/notifications"
        className="bg-amber-400/15 backdrop-blur-sm border border-amber-300/25 text-amber-50 hover:bg-amber-400/25 hover:border-amber-200/40 transition-all duration-200 active:scale-[0.98] px-2 my-2 mt-2 text-center py-2 rounded-3xl w-full font-nunito font-bold text-lg"
      >
        Notifications
      </a>
      <a
        href="#"
        className="bg-amber-400/15 backdrop-blur-sm border border-amber-300/25 text-amber-50 hover:bg-amber-400/25 hover:border-amber-200/40 transition-all duration-200 active:scale-[0.98] px-2 my-2 mt-2 text-center py-2 rounded-3xl w-full font-nunito font-bold text-lg"
      >
        Annual Contributors
      </a>
      {/* <button
      onClick={logoutUser}
        className="bg-red-500 mt-auto text-white my-2 text-center py-2 rounded-lg w-full font-nunito font-bold text-lg"
      >
        Logout
      </button> */}
    </div>
  );
};

export default Sidebar;
