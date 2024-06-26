"use client";

import { useState } from "react";

const Page = () => {
  const [name, setName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [support, setSupport] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const registerMember = async () => {
    setLoading(true);
    const currentTime = Date.now();
    try {
      const res = await fetch("/api/member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          address: address,
          mobile: mobile,
          email: email,
          support: support,
          created_at: currentTime
        }),
      });
      const data = await res.json();
      if (data !== "request failure") {
        console.log(data);
        setName("");
        setAddress("");
        setEmail("");
        setMobile("");
        setSupport("");
        setLoading(false)
      }
    } catch (err) {
      console.error(err);
      setLoading(false)
    }
  };

  return (
    <div className="min-h-screen p-4 pt-24 md:pt-0">
      <section className="font-nunito mb-10 mx-auto max-w-lg rounded-lg">
        <div className="flex flex-col items-center justify-center px-3 md:px-8 py-4 mx-auto md:h-screen lg:py-0">
          <a
            href="#"
            className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
          >
            <img className="w-8 h-8 mr-2" src="/newfavicon.png" alt="logo" />
            Crack Crime Bahamas
          </a>
          <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-4 md:p-6 space-y-4 md:space-y-6 sm:p-8 w-fu">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                Membership Form
              </h1>
              <form className="space-y-4 md:space-y-6" action="#">
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={name}
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder=""
                    required={true}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    E-Mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="abc@example.com"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required={true}
                  />
                </div>
                <div>
                  <label
                    htmlFor="address"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder=""
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required={true}
                  />
                </div>
                <div>
                  <label
                    htmlFor="mobile"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Mobile
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    id="mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder=""
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required={true}
                  />
                </div>
                <div>
                  <p>Select Your Annual Membership Fees</p>
                  <div className="m-2 inline-block text-green-600">
                    <input
                      type="radio"
                      id="friend"
                      name="friend"
                      value="friend"
                      onChange={(e) => setSupport(e.target.value)}
                    />
                    <label htmlFor="friend">$25(Friend)</label>
                  </div>
                  <div className="m-2 inline-block text-blue-500">
                    <input
                      type="radio"
                      id="supporter"
                      name="supporter"
                      value="supporter"
                      onChange={(e) => setSupport(e.target.value)}
                    />
                    <label htmlFor="supporter">$100(Supporter)</label>
                  </div>
                  <div className="m-2 inline-block text-amber-900">
                    <input
                      type="radio"
                      id="bronze"
                      name="bronze"
                      value="bronze"
                      onChange={(e) => setSupport(e.target.value)}
                    />
                    <label htmlFor="bronze">$250(Bronze)</label>
                  </div>
                  <div className="m-2 inline-block text-gray-400">
                    <input
                      type="radio"
                      id="silver"
                      name="silver"
                      value="silver"
                      onChange={(e) => setSupport(e.target.value)}
                    />
                    <label htmlFor="silver">$500(Silver)</label>
                  </div>
                  <div className="m-2 inline-block text-amber-400">
                    <input
                      type="radio"
                      id="gold"
                      name="gold"
                      value="gold"
                      onChange={(e) => setSupport(e.target.value)}
                    />
                    <label htmlFor="gold">$1000(Gold)</label>
                  </div>
                  <div className="m-2 inline-block text-fuchsia-500">
                    <input
                      type="radio"
                      id="platinum"
                      name="platinum"
                      value="platinum"
                      onChange={(e) => setSupport(e.target.value)}
                    />
                    <label htmlFor="platinum">$2500(Platinum)</label>
                  </div>
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
                      forgot password?
                    </a>
                  </div> */}
                {loading ? (
                  <div role="status" className="flex justify-center">
                    <svg
                      aria-hidden="true"
                      className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                    <span className="sr-only">Loading...</span>
                  </div>
                ) : (
                  <button
                    onClick={registerMember}
                    className="w-full rounded-lg bg-slate-200 hover:bg-slate-300 dark:hover:bg-blue-700 dark:text-white focus:ring-4 dark:bg-blue-600 focus:outline-none font-medium text-lg px-5 py-2.5 text-center"
                  >
                    Submit
                  </button>
                )}

                {/* <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                    Don&apos;t have an account yet?{" "}
                    <a
                      href="#"
                      className="font-medium text-primary-600 hover:underline dark:text-primary-500"
                    >
                      Sign up
                    </a>
                  </p> */}
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Page;
