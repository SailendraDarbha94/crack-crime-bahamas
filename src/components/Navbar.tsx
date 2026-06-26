"use client";

import app from "@/lib/firebase";
import { getAuth, signOut } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const Navbar = () => {
  const router = useRouter();
  const path = usePathname();
  const paths: string[] = path.split("/");
  const [height, setHeight] = useState<string>("h-14");

  const toggleNavbar = () => {
    console.log(paths);
    if (height === "h-14") {
      setHeight("h-96");
    } else {
      setHeight("h-14");
    }
  };

  const routeNavigator = (route: string) => {
    setHeight("h-14");
    router.push(route);
  };

  const [loading, setLoading] = useState<boolean>(false);
  const logoutUser = async () => {
    setLoading(true);
    setHeight("h-14");
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
    <main
      className={`fixed md:hidden flex flex-wrap bottom-0 left-0 w-full bg-amber-950/85 backdrop-blur-xl border-t border-amber-400/30 ${height} transition-[height]`}
    >
      {height === "h-14" ? (
        <div
          className={`bg-amber-400/15 backdrop-blur-sm w-full h-14 px-4 flex justify-between items-center hover:cursor-pointer`}
          onClick={toggleNavbar}
        >
          <span className="font-nunito text-2xl font-extrabold flex items-center w-full">
            <p>Expand Menu</p> &nbsp;
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10"
            viewBox="0 0 24 24"
          >
            <g
              fill="none"
              stroke="#fef3c7"
              strokeDasharray="24"
              strokeDashoffset="24"
              strokeLinecap="round"
              strokeWidth="2"
            >
              <path d="M5 5H19">
                <animate fill="freeze" attributeName="strokeDashoffset" dur="0.3s" values="24;0" />
              </path>
              <path d="M5 12H19">
                <animate fill="freeze" attributeName="strokeDashoffset" begin="0.2s" dur="0.3s" values="24;0" />
              </path>
              <path d="M5 19H19">
                <animate fill="freeze" attributeName="strokeDashoffset" begin="0.4s" dur="0.3s" values="24;0" />
              </path>
            </g>
          </svg>
        </div>
      ) : null}
      {paths.includes("admin") ? (
        <div
          className="h-14 bg-red-500/20 backdrop-blur-sm border-b border-red-400/30 text-red-200 w-full px-4 flex items-center font-nunito text-2xl font-extrabold hover:cursor-pointer"
          onClick={logoutUser}
        >
          Logout
        </div>
      ) : (
        <div
          className="h-14 bg-amber-400/20 backdrop-blur-sm border-b border-amber-300/25 text-amber-50 w-full px-4 flex items-center font-nunito text-2xl font-extrabold hover:cursor-pointer"
          onClick={() => routeNavigator("/")}
        >
          <img src="/newfavicon.png" alt="logo" className="h-8 w-8 mx-2" />
          Crack Crime Bahamas
        </div>
      )}
      <div
        className="h-14 bg-amber-400/15 backdrop-blur-sm border-b border-amber-300/20 text-amber-50 w-full px-4 flex items-center font-nunito text-2xl font-extrabold hover:cursor-pointer"
        onClick={() =>
          paths.includes("admin")
            ? routeNavigator("/admin/missing")
            : routeNavigator("/member")
        }
      >
        {paths.includes("admin") ? "Add Missing Person" : "Become A Sponsor"}
      </div>
      <div
        className="h-14 bg-amber-400/12 backdrop-blur-sm border-b border-amber-300/18 text-amber-50 w-full px-4 flex items-center font-nunito text-2xl font-extrabold hover:cursor-pointer"
        onClick={() =>
          paths.includes("admin")
            ? routeNavigator("/admin/wanted")
            : routeNavigator("/more-about-us")
        }
      >
        {paths.includes("admin") ? "Add Wanted Person" : "More About Us"}
      </div>
      <div
        className="h-14 bg-amber-400/12 backdrop-blur-sm border-b border-amber-300/18 text-amber-50 w-full px-4 flex items-center font-nunito text-2xl font-extrabold hover:cursor-pointer"
        onClick={() =>
          paths.includes("admin")
            ? routeNavigator("/admin/adverts")
            : routeNavigator("/more-about-us")
        }
      >
        {paths.includes("admin") ? "Advertisements" : "More About Us"}
      </div>
      <div
        className="h-14 bg-amber-300/10 backdrop-blur-sm border-b border-amber-300/15 text-amber-100 w-full px-4 flex items-center font-nunito text-2xl font-extrabold hover:cursor-pointer"
        onClick={() =>
          paths.includes("admin")
            ? routeNavigator("/admin")
            : routeNavigator("/login")
        }
      >
        {paths.includes("admin") ? "Admin Account Home" : "Admin Login"}
      </div>
      <div
        className={`bg-amber-400/10 backdrop-blur-sm border-t border-amber-300/20 w-full h-16 px-4 flex justify-between items-center hover:cursor-pointer`}
        onClick={toggleNavbar}
      >
        <span className="font-nunito text-2xl font-extrabold flex items-center w-full">
          <p>Close Menu</p> &nbsp;
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10"
          //width="1em"
          //height="1em"
          viewBox="0 0 24 24"
        >
          <g
            fill="none"
            stroke="#fef3c7"
            strokeDasharray="16"
            strokeDashoffset="16"
            strokeLinecap="round"
            strokeWidth="2"
          >
            <path d="M7 7L17 17" strokeDashoffset="0" />
            <path d="M17 7L7 17" strokeDashoffset="0" />
          </g>
        </svg>
      </div>
    </main>
  );
};

export default Navbar;
