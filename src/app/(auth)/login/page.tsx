"use client";
import app from "@/lib/firebase";
import { ToastContext } from "@/lib/toastContext";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";

const Page = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const router = useRouter();
  const { toast } = useContext(ToastContext);

  const loginUser = async () => {
    setLoading(true);
    const auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).then(() => {
      signInWithEmailAndPassword(auth, email, password)
        .then((cb) => {
          console.log(cb);
          setLoading(false);
          if (cb.user) {
            toast({
              type: "success",
              message: "User Logged In! Redirecting",
            });
            setTimeout(() => {
              router.push("/admin");
            }, 500);
          }
        })
        .catch((err) => {
          setLoading(false);
          toast({
            type: "error",
            message: `Error Occurred! ${err.code ? err.code : "Please Try Again Later!"}`,
          });
        });
    });
  };

  return (
    <main className="min-h-screen">
      <section className=" dark:bg-gray-900 font-nunito p-4">
        <div className="flex flex-col items-center justify-center mx-auto md:min-h-screen lg:py-0">
          <a
            href="#"
            className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
          >
            <img className="w-8 h-8 mr-2" src="/newfavicon.png" alt="logo" />
            Crack Crime Bahamas
          </a>
          <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                Login to Admin Account
              </h1>
              <div className="space-y-4 md:space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Your email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="bg-gray-50 border focus:outline-none border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={true}
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-50 border focus:outline-none border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    required={true}
                  />
                </div>
                <button
                  //type="submit"
                  onClick={loginUser}
                  className="w-full rounded-lg bg-slate-200 hover:bg-slate-300 dark:hover:bg-blue-700 dark:text-white focus:ring-4 dark:bg-blue-600 focus:outline-none font-medium text-lg px-5 py-2.5 text-center"
                >
                  {loading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    <span>Submit</span>
                  )}
                </button>
                <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                  Don&apos;t have an Admin Account?{" "}
                  <a
                    href="/sign-up"
                    className="font-medium underline text-blue-500"
                  >
                    Request Admin Priviliges
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
