"use client";
import app, { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const [numberOfMissings, setNumberOfMissings] = useState<number>(0);
  const [numberOfWanteds, setNumberOfWanteds] = useState<number>(0);
  const [numberOfMessages, setNumberOfMessages] = useState<number>(0);

  const gettingNumbers = async () => {
    setLoading(true);
    const missingsRef = ref(database, "missings");
    const wantedsRef = ref(database, "wanteds");
    const messagesRef = ref(database, "messages");
    try {
      const missingsSnapshot = await get(missingsRef);
      const wantedsSnapshot = await get(wantedsRef);
      const messagesSnapshot = await get(messagesRef);

      if (!missingsSnapshot.exists()) {
        console.log("No data available");
        return;
      } else {
        console.log("Number of Missing Persons is ", missingsSnapshot.size)
        setNumberOfMissings(missingsSnapshot.size);
      }

      if (!wantedsSnapshot.exists()) {
        console.log("No data available");
        return;
      } else {
        console.log("Number of Wanted Persons is ", wantedsSnapshot.size)
        setNumberOfWanteds(wantedsSnapshot.size);
      }

      if (!messagesSnapshot.exists()) {
        console.log("No data available");
        return;
      } else {
        console.log("Number of Messages is ", messagesSnapshot.size)
        setNumberOfMessages(messagesSnapshot.size);
      }

    } catch (error) {
      console.error("Error fetching missings data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    gettingNumbers();
  }, [])

  return (
    <div className="min-h-fit font-nunito flex flex-wrap p-4 md:p-14">
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
        <div className="w-full font-nunito text-lg">
          <h1 className="underline font-bold text-5xl pb-4 mb-4 text-center">ADMIN DASHBOARD</h1>

          <div className="flex flex-wrap w-full p-4 rounded-lg gap-4">
            <div className="w-full md:w-1/3 lg:w-1/4 min-h-80 hover:cursor-pointer">
              <p className="text-center text-3xl font-bold">Missing : {numberOfMissings ? numberOfMissings : "Loading..."}</p>
              <img src="/thumbnails/missingThumbnail.png" alt="Missing Person Thumbnail" className="rounded-lg" />
            </div>
            <div className="w-full md:w-1/3 lg:w-1/4 min-h-80 hover:cursor-pointer">
              <p className="text-center text-3xl font-bold">Wanted : {numberOfWanteds ? numberOfWanteds : "Loading..."}</p>
              <img src="/thumbnails/wantedThumbnail3.png" alt="Wanted Person Thumbnail" className="rounded-3xl" />
            </div>
            <div className="w-full md:w-1/3 lg:w-1/4 min-h-80 hover:cursor-pointer">
              <p className="text-center text-3xl font-bold">Tips : {numberOfMessages ? numberOfMessages : "Loading..."}</p>
              <img src="/thumbnails/tips.png" alt="Messages Thumbnail" className="rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
