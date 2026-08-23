"use client";
import app from "@/lib/firebase";
import { ToastContext } from "@/lib/toastContext";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";

const Page = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const router = useRouter();
  const { toast } = useContext(ToastContext);

  const loginUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).then(() => {
      signInWithEmailAndPassword(auth, email, password)
        .then((cb) => {
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
      <section className="font-nunito p-4">
        <div className="flex flex-col items-center justify-center mx-auto md:min-h-screen lg:py-0">
          <Link
            href="/"
            className="flex items-center mb-6 text-2xl font-semibold text-amber-950"
          >
            <img className="w-8 h-8 mr-2" src="/newfavicon.png" alt="Crack Crime Bahamas logo" />
            Crack Crime Bahamas
          </Link>
          <div className="w-full bg-white/25 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(120,72,10,0.12)] md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-amber-950 md:text-2xl">
                Login to Admin Account
              </h1>
              <form className="space-y-4 md:space-y-6" onSubmit={loginUser}>
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-amber-950"
                  >
                    Your email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="bg-white/40 backdrop-blur-md border border-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400/60 text-amber-950 placeholder-amber-900/50 sm:text-sm rounded-xl block w-full p-2.5"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={true}
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-amber-950"
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
                    className="bg-white/40 backdrop-blur-md border border-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400/60 text-amber-950 placeholder-amber-900/50 sm:text-sm rounded-xl block w-full p-2.5"
                    required={true}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-white/40 backdrop-blur-md border border-white/60 hover:bg-white/55 text-amber-950 focus:ring-4 focus:ring-amber-300/50 focus:outline-none font-bold text-lg px-5 py-2.5 text-center transition-all duration-200 active:scale-95"
                >
                  {loading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    <span>Submit</span>
                  )}
                </button>
                <p className="text-sm font-light text-amber-900/80">
                  Don&apos;t have an Admin Account?{" "}
                  <Link
                    href="/sign-up"
                    className="font-medium underline text-amber-800 hover:text-amber-950"
                  >
                    Request Admin Priviliges
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
