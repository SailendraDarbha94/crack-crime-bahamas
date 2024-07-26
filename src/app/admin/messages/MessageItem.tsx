"use client";
import CryptoES from "crypto-es";
import app from "@/lib/firebase";
import { dateReader } from "@/lib/utils";
import { getDatabase, ref, remove, set } from "firebase/database";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MessageItem = ({ item, refreshFunc }: any) => {
  const router = useRouter();

  const [editing, setEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>(item.message);

  const deleteMessage = async (id: string) => {
    setLoading(true);
    try {
      const db = getDatabase(app);
      const postRef = ref(db, `messages/${id}`);
      await remove(postRef);
      setLoading(false);
      console.log("post deleted successfullyy");
      await refreshFunc();
    } catch (err) {
      setLoading(false);
      console.log("could not delete_______", JSON.stringify(err));
    }
  };

  const editMessage = async () => {
    
    setLoading(true);
    if(message.length < 2){
      setEditing(false);
      alert("unaccepted edits")
      return
    }
    const currentDateTimeStamp = new Date().toISOString();
    try {
      const db = getDatabase(app);
      const postRef = ref(db, `messages/${item.id}`);
      const newObj = {
        message: message,
        created_at: item.created_at,
        updated_at: currentDateTimeStamp,
      };
      console.log(newObj);
      await set(postRef, {...newObj});
      setEditing(false);
      window.location.reload()
    } catch (err) {
      console.log("errror occiurreddd", JSON.stringify(err));
    }
  };

  return loading ? (
    <div className="w-full min-h-96 flex justify-center items-center">
      <div
        role="status"
        className="flex min-h-96 max-h-full justify-center items-center"
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
    </div>
  ) : (
    <div className="bg-slate-50 text-black max-w-md mx-auto rounded-lg shadow-lg my-2 p-4 flex flex-col min-h-40 justify-between">
      {editing ? (
        <div>
          <label htmlFor="editing" className="font-nunito text-sm font-bold">
            New Message
          </label>
          <textarea
            //rows={10}
            cols={10}
            id="editing"
            placeholder={item.message}
            value={message}
            onChange={(e: any) => setMessage(e.target.value)}
            className="border-2 border-blue-500 rounded-md p-1 block w-full"
          />
          <button
            onClick={editMessage}
            className="bg-blue-700 hover:text-black hover:bg-amber-200 my-4 p-2 min-w-40 w-full text-white rounded-md font-mono tracking-wider font-extrabold"
          >
            SUBMIT
          </button>
        </div>
      ) : (
        <p className="font-bold font-nunito text-xl">{item.message}</p>
      )}

      <p className="font-nunito font-semibold text-sm">
        Sent : {dateReader(item.created_at)}
      </p>
      <div className="flex justify-center pt-8">
        <button
          onClick={() => setEditing(!editing)}
          className="bg-slate-700 w-full hover:text-black hover:bg-amber-200 p-2 min-w-40 text-white rounded-md font-mono tracking-wider font-extrabold"
        >
          {editing ? "CANCEL" : "EDIT"}
        </button>
        {/* <button
          onClick={() => deleteMessage(item.id)}
          className="bg-red-700 text-white p-2 min-w-40 rounded-md font-mono tracking-wider font-extrabold"
        >
          DELETE
        </button> */}
      </div>
    </div>
  );
};

export default MessageItem;
