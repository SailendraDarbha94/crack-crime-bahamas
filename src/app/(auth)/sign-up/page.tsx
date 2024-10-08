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
      !lastName
    ) {
      toast({
        type: "error",
        message: "Please fill the details",
      });
    } else {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          console.log(user);
          saveUserData(user.uid, firstName, lastName, user.email);
          setFirstName("");
          setLastName("");
          setPassword("");
          setConfirmPassword("");
          setEmail("");
          toast({
            type: "success",
            message: "User Sign-Up Successfull!",
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

  return (
    <main>
      <section className="font-nunito p-4 md:p-14 lg:p-24">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:min-h-screen lg:py-0">
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
                Request for Admin Account
              </h1>
              <div className="space-y-4 md:space-y-6">
                <div>
                  <label
                    htmlFor="firstname"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstname"
                    id="firstname"
                    className="bg-gray-50 border focus:outline-none border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder=""
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required={true}
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastname"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastname"
                    id="lastname"
                    className="bg-gray-50 border focus:outline-none border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder=""
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required={true}
                  />
                </div>
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
                <div>
                  <label
                    htmlFor="confirmpassword"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmpassword"
                    id="confirmpassword"
                    className="bg-gray-50 border focus:outline-none border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={true}
                  />
                </div>
                {/* <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="remember"
                        aria-describedby="remember"
                        type="checkbox"
                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                        required={true}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="remember"
                        className="text-gray-500 dark:text-gray-300"
                      >
                        Remember me
                      </label>
                    </div>
                  </div>
                  <a
                    href="#"
                    className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
                  >
                    Forgot password?
                  </a>
                </div> */}
                <button
                  //type="submit"
                  onClick={createNewUser}
                  className="w-full rounded-lg bg-slate-200 hover:bg-slate-300 dark:hover:bg-blue-700 dark:text-white focus:ring-4 dark:bg-blue-600 focus:outline-none font-medium text-lg px-5 py-2.5 text-center"
                >
                  Submit
                </button>
                <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                  Already have an Admin Account?{" "}
                  <a
                    href="/login"
                    className="font-medium underline text-blue-500"
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
