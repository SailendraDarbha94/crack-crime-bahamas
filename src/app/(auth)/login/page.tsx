// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";

// const Page = () => {
//   const [username, setUsername] = useState<string>("");
//   const [password, setPassword] = useState<string>("");
//   const router = useRouter();
//   const handleLogin = async () => {
//     if (!username || !password) {
//       alert("error");
//       return;
//     }
//     if (
//       username === process.env.NEXT_PUBLIC_USERNAME &&
//       password === process.env.NEXT_PUBLIC_PASSWORD
//     ) {
//       await localStorage.setItem(
//         "token",
//         JSON.stringify({
//           token: "something",
//         })
//       );
//       router.push("/admin");
//     }
//   };

//   return (
//     <div className="min-h-screen p-4 pt-24 md:pt-0">
//       <section className="font-nunito mb-10 mx-auto max-w-lg rounded-lg">
//         <div className="flex flex-col items-center justify-center px-3 md:px-8 py-4 mx-auto md:h-screen lg:py-0">
//           <a
//             href="#"
//             className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
//           >
//             <img className="w-8 h-8 mr-2" src="/newfavicon.png" alt="logo" />
//             Crack Crime Bahamas
//           </a>
//           <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
//             <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
//               <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
//                 Admin Account Login
//               </h1>
//               <div className="space-y-4 md:space-y-6">
//                 <div>
//                   <label
//                     htmlFor="email"
//                     className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
//                   >
//                     Your email
//                   </label>
//                   <input
//                     type="email"
//                     name="email"
//                     id="email"
//                     value={username}
//                     className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
//                     placeholder="name@company.com"
//                     required={true}
//                     onChange={(e) => setUsername(e.target.value)}
//                   />
//                 </div>
//                 <div>
//                   <label
//                     htmlFor="password"
//                     className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
//                   >
//                     Password
//                   </label>
//                   <input
//                     type="password"
//                     name="password"
//                     id="password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     placeholder="••••••••"
//                     className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
//                     required={true}
//                   />
//                 </div>
//                 {/* <div className="flex items-center justify-between">
//                   <div className="flex items-start">
//                     <div className="flex items-center h-5">
//                       <input
//                         id="remember"
//                         aria-describedby="remember"
//                         type="checkbox"
//                         className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
//                         required={true}
//                       />
//                     </div>
//                     <div className="ml-3 text-sm">
//                       <label
//                         htmlFor="remember"
//                         className="text-gray-500 dark:text-gray-300"
//                       >
//                         Remember me
//                       </label>
//                     </div>
//                   </div>
//                   <a
//                     href="#"
//                     className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
//                   >
//                     forgot password?
//                   </a>
//                 </div> */}
//                 <button
//                   //type="submit"
//                   onClick={handleLogin}
//                   className="w-full rounded-lg bg-slate-200 hover:bg-slate-300 dark:hover:bg-blue-700 dark:text-white focus:ring-4 dark:bg-blue-600 focus:outline-none font-medium text-lg px-5 py-2.5 text-center"
//                 >
//                   Submit
//                 </button>
//                 <p className="text-sm font-light text-gray-500 dark:text-gray-400">
//                   Don&apos;t have an admin account?{" "}
//                   <a
//                     href="/sign-up"
//                     className="font-medium text-primary-600 text-blue-500 underline dark:text-primary-500"
//                   >
//                     Request Admin Priviliges
//                   </a>
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default Page;
"use client";
import app from "@/lib/firebase";
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

const Page = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();
  // const somethingElse = async () => {
  //   const auth = await getAuth(app)
  //   setPersistence(auth, browserLocalPersistence).then(() => {
  //     signInWithEmailAndPassword(auth, email, password).then((cb) => {
  //       console.log(cb)
  //     })
  //   })
  // }
  const loginUser = async () => {
    // const res = await fetch('/api/auth/login', {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     email: email,
    //     password: password
    //   }),
    // })
    // const { data } = await res.json()
    // console.log(data)
    // if (data === "success"){
    //   router.push('/')
    // }
    setLoading(true);
    try {
      const auth = await getAuth(app);
      setPersistence(auth, browserLocalPersistence).then(() => {
        signInWithEmailAndPassword(auth, email, password).then((cb) => {
          console.log(cb);
          if (cb.user) {
            setTimeout(() => {
              router.push("/admin");
            }, 1500);
          }
        });
      });
    } catch (err) {
      console.log("Error Occured", err);
    }
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
                  onClick={loginUser}
                  className="w-full rounded-lg bg-slate-200 hover:bg-slate-300 dark:hover:bg-blue-700 dark:text-white focus:ring-4 dark:bg-blue-600 focus:outline-none font-medium text-lg px-5 py-2.5 text-center"
                >
                  {loading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    <span>Submit</span>
                  )}
                </button>
                {/* <button
                  //type="submit"
                  onClick={logouter}
                  className="w-full text-white bg-primary hover:bg-primaryMore focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                >
                  {loading ? <div>Loading...</div> : <span>Logout</span>}
                </button> */}
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
