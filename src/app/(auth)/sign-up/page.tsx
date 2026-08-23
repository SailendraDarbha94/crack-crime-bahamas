"use client";

import { useContext, useEffect, useState } from "react";
import { getDatabase, ref, child, get, set, push } from "firebase/database";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import app from "@/lib/firebase";
import { ToastContext } from "@/lib/toastContext";
const Page = () => {
  const auth = getAuth(app);
  const db = getDatabase(app);
  const { toast } = useContext(ToastContext);

  const createNewUser = async () => {
    if (password !== confirmPassword) {
      toast({
        type: "error",
        message: "Passwords do not match",
      });
      return;
    } else if (
      !email ||
      !password ||
      !confirmPassword ||
      !firstName ||
      !lastName ||
      !inviteCode
    ) {
      toast({
        type: "error",
        message: "Please fill the details, including your invite code",
      });
    } else {
      // Server-verified invite gate — the code is compared against a
      // server-only env var, never shipped to the browser.
      try {
        const inviteRes = await fetch("/api/auth/verify-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: inviteCode }),
        });
        const { ok } = await inviteRes.json();
        if (!ok) {
          toast({
            type: "error",
            message: "Invalid invite code. Contact an administrator for access.",
          });
          return;
        }
      } catch {
        toast({
          type: "error",
          message: "Could not verify invite code. Please try again.",
        });
        return;
      }

      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          saveUserData(user.uid, firstName, lastName, user.email);
          setFirstName("");
          setLastName("");
          setPassword("");
          setConfirmPassword("");
          setEmail("");
          setInviteCode("");
          toast({
            type: "success",
            message: "Account created! An administrator must approve it before you can access the dashboard.",
          });
        })
        .catch((err) => {
          console.log("OPERATION FAILED...", JSON.stringify(err));
          toast({
            type: "error",
            message: `Error Occurred! ${
              err.code ? err.code : "Please Try Again Later!"
            }`,
          });
          //this happens with 400 Bad Request, build error handling
          //OPERATION FAILED... {"code":"auth/invalid-email","customData":{},"name":"FirebaseError"}
        });
    }
  };

  const saveUserData = async (
    userId: string,
    firstName: string,
    lastName: string,
    email: string | null
  ) => {
    try {
      const currentTime = Date.now();
      set(ref(db, "users/" + userId), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        created_at: currentTime,
      })
        .then((cb) => {
          console.log(cb);
          toast({
            type: "success",
            message: "User Saved In Database",
          });
        })
        .catch((err) => {
          toast({
            type: "error",
            message: `Error Occurred! ${
              err.code ? err.code : "Please Try Again Later!"
            }`,
          });
        });
    } catch (err) {
      console.log(err);
    }
  };

  // const createUser = async () => {
  //     try {
  //         const newLocation = push(usersRef, {firstName: "firstName",
  //         lastName: "lastName",
  //         email: "email"}).then((callback) => console.log(callback)).finally(() => {
  //             alert('User data saved')
  //         })
  //     } catch (err) {
  //         console.log(err)
  //     }
  // }

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [inviteCode, setInviteCode] = useState<string>("");

  return (
    <main>
      <section className="font-nunito p-4 md:p-14 lg:p-24">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:min-h-screen lg:py-0">
          <a
            href="/"
            className="flex items-center mb-6 text-2xl font-semibold text-amber-950"
          >
            <img className="w-8 h-8 mr-2" src="/newfavicon.png" alt="Crack Crime Bahamas logo" />
            Crack Crime Bahamas
          </a>
          <div className="w-full bg-white/25 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(120,72,10,0.12)] md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-amber-950 md:text-2xl">
                Request for Admin Account
              </h1>
              <div className="space-y-4 md:space-y-6">
                <div>
                  <label
                    htmlFor="firstname"
                    className="block mb-2 text-sm font-medium text-amber-950"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstname"
                    id="firstname"
                    className="bg-white/40 backdrop-blur-md border border-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400/60 text-amber-950 placeholder-amber-900/50 sm:text-sm rounded-xl block w-full p-2.5"
                    placeholder=""
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required={true}
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastname"
                    className="block mb-2 text-sm font-medium text-amber-950"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastname"
                    id="lastname"
                    className="bg-white/40 backdrop-blur-md border border-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400/60 text-amber-950 placeholder-amber-900/50 sm:text-sm rounded-xl block w-full p-2.5"
                    placeholder=""
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required={true}
                  />
                </div>
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
                <div>
                  <label
                    htmlFor="confirmpassword"
                    className="block mb-2 text-sm font-medium text-amber-950"
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmpassword"
                    id="confirmpassword"
                    className="bg-white/40 backdrop-blur-md border border-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400/60 text-amber-950 placeholder-amber-900/50 sm:text-sm rounded-xl block w-full p-2.5"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={true}
                  />
                </div>
                <div>
                  <label
                    htmlFor="invitecode"
                    className="block mb-2 text-sm font-medium text-amber-950"
                  >
                    Invite Code
                  </label>
                  <input
                    type="password"
                    name="invitecode"
                    id="invitecode"
                    className="bg-white/40 backdrop-blur-md border border-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400/60 text-amber-950 placeholder-amber-900/50 sm:text-sm rounded-xl block w-full p-2.5"
                    placeholder="Provided by an administrator"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required={true}
                  />
                </div>
                <button
                  type="button"
                  onClick={createNewUser}
                  className="w-full rounded-xl bg-white/40 backdrop-blur-md border border-white/60 hover:bg-white/55 text-amber-950 focus:ring-4 focus:ring-amber-300/50 focus:outline-none font-bold text-lg px-5 py-2.5 text-center transition-all duration-200 active:scale-95"
                >
                  Submit
                </button>
                <p className="text-sm font-light text-amber-900/80">
                  Already have an Admin Account?{" "}
                  <a
                    href="/login"
                    className="font-medium underline text-amber-800 hover:text-amber-950"
                  >
                    Login
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
