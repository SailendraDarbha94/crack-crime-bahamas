"use client";

import app from "@/lib/firebase";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [missingPersons, setMissingPersons] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const fetchMembers = async () => {
    setLoading(true);
    setMessages([]);
    setMissingPersons([]);
    try {
      const res = await fetch("/api/member");
      const { data } = await res.json();
      if (data) {
        setMembers(data);
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      console.log(err);
      alert("An Error Occured! Please try again later");
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    setMembers([]);
    setMissingPersons([]);
    try {
      const res = await fetch("/api/message");
      const { data } = await res.json();
      if (data) {
        setMessages(data);
        setLoading(false);
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
      alert("An Error Occured! Please try again later");
    }
  };

  const fetchWantedPersons = async () => {
    setLoading(true);
    setMembers([]);
    setMessages([]);
    try {
      const res = await fetch("/api/wanted");
      const { data } = await res.json();
      console.log(data);
      if (data) {
        setLoading(false);
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
      alert("An Error Occured! Please try again later");
    }
  };

  const fetchMissingPersons = async () => {
    setLoading(true);
    setMembers([]);
    setMessages([]);
    try {
      const res = await fetch("/api/missing");
      const { data } = await res.json();
      console.log(data);
      if (data) {
        setMissingPersons(data);
        setLoading(false);
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
      alert("An Error Occured! Please try again later");
    }
  };

  // const getIdToken = async () => {
  //   const token = await localStorage.getItem('token');
  //   console.log(token);
  // }

  // useEffect(() => {
  //   getIdToken();
  // },[])
  // const postData = async () => {
  //   const res = await fetch("/api/message", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       message: message,
  //     }),
  //   });
  //   const data = await res.json()
  //   if(data){
  //       setMessage("")
  //   }
  //   console.log(data)
  // };
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
    <div className="min-h-fit p-4 md:p-14 lg:p-24">
      <h1 className="text-4xl mb-2 font-nunito">Admin Dashboard</h1>
      <h1 className="text-2xl mt-2 font-nunito">
        Page Under Construction
      </h1>
      <button
        onClick={logoutUser}
        className="w-full max-w-sm rounded-lg bg-emerald-300 hover:bg-emerald-700 hover:text-white dark:hover:bg-blue-700 dark:text-white focus:ring-4 dark:bg-blue-600 focus:outline-none font-medium text-lg px-5 py-2.5 text-center"
      >
        Logout
      </button>
      {loading ? (
        <div
          role="status"
          className="flex justify-center min-h-96 items-center"
        >
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
        <div className="mt-20 font-nunito text-lg">
          <h1 className="underline text-xl mb-10">Testing Apis</h1>
          <button
            className="w-40 block my-4 text-center rounded-lg bg-blue-700 text-white"
            onClick={fetchMembers}
          >
            Fetch Members
          </button>
          <button
            className="w-40 block my-4 text-center rounded-lg bg-blue-700 text-white"
            onClick={fetchMessages}
          >
            Fetch Messages
          </button>
          <button
            className="w-40 block my-4 text-center rounded-lg bg-blue-700 text-white"
            onClick={fetchMissingPersons}
          >
            Fetch Missing Persons
          </button>
          <button
            className="w-40 block my-4 text-center rounded-lg bg-blue-700 text-white"
            onClick={fetchWantedPersons}
          >
            Fetch Wanted Persons
          </button>
          <hr />
          <div>
            {members ? (
              <div>
                {members.map((member: any) => {
                  return (
                    <div
                      key={member._id}
                      className="bg-blue-200 text-black rounded-lg my-4 p-4 font-nunito font-semibold"
                    >
                      <p>Name : {member._name}</p>
                      <p>Email : {member._email}</p>
                      <p>Phone : {member._mobile}</p>
                      <p>Level : {member._support}</p>
                      <p>Address : {member._address}</p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div>
            {messages ? (
              <div>
                {messages.map((message: any) => {
                  return (
                    <div
                      key={message._id}
                      className="bg-blue-200 text-black rounded-lg my-4 p-4 font-nunito font-semibold"
                    >
                      <p>id : {message._id}</p>
                      <p>Tip : {message.message}</p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
          {/* <div className="mt-10">
          <label htmlFor="message">Message</label>
          <input value={message} type="text" name="message" id="message" className="mx-4 rounded-lg text-black p-2 focus:outline-none" onChange={e => setMessage(e.target.value)} />
        </div>
        <button
          className="w-40 block my-4 text-center rounded-lg bg-blue-700 text-white"
          onClick={postData}
        >
          Post
        </button> */}
        </div>
      )}
    </div>
  );
};

export default Page;
