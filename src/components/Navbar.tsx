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
      className={`fixed md:hidden flex flex-wrap bottom-0 left-0 w-full bg-black ${height} transition-[height] border-t-2 border-black`}
    >
      {height === "h-14" ? (
        <div
          className={`bg-yellow-200 dark:bg-slate-900 w-full h-14 px-4 flex justify-between items-center hover:cursor-pointer`}
          onClick={toggleNavbar}
        >
          <span className="font-nunito text-2xl font-extrabold flex items-center w-full">
            <p>Expand Menu</p> &nbsp;
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 block dark:hidden"
            //   width="1em"
            //   height="1em"
            viewBox="0 0 24 24"
          >
            <g
              fill="none"
              stroke="black"
              strokeDasharray="24"
              strokeDashoffset="24"
              strokeLinecap="round"
              strokeWidth="2"
            >
              <path d="M5 5H19">
                <animate
                  fill="freeze"
                  attributeName="strokeDashoffset"
                  dur="0.3s"
                  values="24;0"
                />
              </path>
              <path d="M5 12H19">
                <animate
                  fill="freeze"
                  attributeName="strokeDashoffset"
                  begin="0.2s"
                  dur="0.3s"
                  values="24;0"
                />
              </path>
              <path d="M5 19H19">
                <animate
                  fill="freeze"
                  attributeName="strokeDashoffset"
                  begin="0.4s"
                  dur="0.3s"
                  values="24;0"
                />
              </path>
            </g>
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 hidden dark:block"
            //   width="1em"
            //   height="1em"
            viewBox="0 0 24 24"
          >
            <g
              fill="none"
              stroke="white"
              strokeDasharray="24"
              strokeDashoffset="24"
              strokeLinecap="round"
              strokeWidth="2"
            >
              <path d="M5 5H19">
                <animate
                  fill="freeze"
                  attributeName="strokeDashoffset"
                  dur="0.3s"
                  values="24;0"
                />
              </path>
              <path d="M5 12H19">
                <animate
                  fill="freeze"
                  attributeName="strokeDashoffset"
                  begin="0.2s"
                  dur="0.3s"
                  values="24;0"
                />
              </path>
              <path d="M5 19H19">
                <animate
                  fill="freeze"
                  attributeName="strokeDashoffset"
                  begin="0.4s"
                  dur="0.3s"
                  values="24;0"
                />
              </path>
            </g>
          </svg>
        </div>
      ) : null}
      {paths.includes("admin") ? (
        <div
          className="h-14 bg-red-500 text-white w-full px-4 flex items-center font-nunito text-2xl font-extrabold hover:cursor-pointer"
          onClick={logoutUser}
        >
          Logout
        </div>
      ) : (
        <div
          className="h-14 bg-amber-500 dark:bg-gray-900 w-full px-4 flex items-center font-nunito text-2xl font-extrabold hover:cursor-pointer"
          onClick={() => routeNavigator("/")}
        >
          <img src="/newfavicon.png" alt="logo" className="h-8 w-8 mx-2" />
          Crack Crime Bahamas
        </div>
      )}
      <div
        className="h-14 bg-amber-400 dark:bg-gray-800 w-full px-4 flex items-center font-nunito text-2xl font-extrabold hover:cursor-pointer"
        onClick={() =>
          paths.includes("admin")
            ? routeNavigator("/admin/missing")
            : routeNavigator("/member")
        }
      >
        {paths.includes("admin") ? "Add Missing Person" : "Become A Sponsor"}
      </div>
      <div
        className="h-14 bg-amber-300 dark:bg-gray-700 w-full px-4 flex items-center font-nunito text-2xl font-extrabold hover:cursor-pointer"
        onClick={() =>
          paths.includes("admin")
            ? routeNavigator("/admin/wanted")
            : routeNavigator("/more-about-us")
        }
      >
        {paths.includes("admin") ? "Add Wanted Person" : "More About Us"}
      </div>
      <div
        className="h-14 bg-amber-300 dark:bg-gray-700 w-full px-4 flex items-center font-nunito text-2xl font-extrabold hover:cursor-pointer"
        onClick={() =>
          paths.includes("admin")
            ? routeNavigator("/admin/adverts")
            : routeNavigator("/more-about-us")
        }
      >
        {paths.includes("admin") ? "Advertisements" : "More About Us"}
      </div>
      <div
        className="h-14 bg-yellow-300 dark:bg-gray-600 w-full px-4 flex items-center font-nunito text-2xl font-extrabold hover:cursor-pointer"
        onClick={() =>
          paths.includes("admin")
            ? routeNavigator("/admin")
            : routeNavigator("/login")
        }
      >
        {paths.includes("admin") ? "Admin Account Home" : "Admin Login"}
      </div>
      <div
        className={`bg-yellow-200 dark:bg-gray-500 w-full h-16 px-4 flex justify-between items-center hover:cursor-pointer border-black`}
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
            stroke="black"
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
