"use client";

import app from "@/lib/firebase";
import { useEffect, useState } from "react";
import AddMissing from "./AddMissing";
import { child, get, getDatabase, ref, remove } from "firebase/database";
import MissingListItem from "./MissingListItem";
import { useRouter } from "next/navigation";

const Page = () => {
  const [showMissing, setShowMissing] = useState<boolean>(false);
  const [addMissing, setAddMissing] = useState<boolean>(false);
  const [missingIndices, setMissingIndices] = useState<any[] | null>(null);
  const [missings, setMissings] = useState<any>(null);
  const fetchMissingPersons = async () => {
    try {
      const db = getDatabase(app);
      const dbRef = await ref(db);
      const data = await get(child(dbRef, "missings"));
      if (data.exists()) {
        const missings = await data.val();
        const indices = Object.keys(missings);

        setMissings(missings);
        setMissingIndices(indices);
      }
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  };

  const deleteMissingPost = async (id: string) => {
    try {
      const db = getDatabase(app);
      const postRef = ref(db, `missings/${id}`)
      await remove(postRef);
      console.log("post deleted successfullyy")
      fetchMissingPersons()
    } catch (err) {
      console.log("could not delete_______",JSON.stringify(err))
    }
  };

  useEffect(() => {
    fetchMissingPersons();
  }, []);

  return (
    <main className="font-nunito py-3">
      <h1 className="text-3xl border-b-2 border-black">Missing Persons</h1>
      <div className="flex p-2 mb-4 justify-around">
        <button
          className="bg-purple-200 dark:bg-slate-500 p-2 rounded-lg"
          onClick={() => setShowMissing(!showMissing)}
        >
          {showMissing ? "Hide Missing Persons" : "Show Missing Persons"}
        </button>
        <button
          className="bg-purple-200 dark:bg-slate-500 p-2 rounded-lg"
          onClick={() => setAddMissing(!addMissing)}
        >
          {addMissing ? "Hide Missing Form" : "Add Missing Persons"}
        </button>
      </div>
      {addMissing ? <AddMissing /> : null}
      {showMissing ? (
        <div className="w-full">
          {missingIndices &&
            missingIndices.map((missing) => {
              //const url = await fetchImage(missings[missing].image);
              console.log({ ...missings[missing] });
              return (
                <div
                  key={missing}
                  className="border-2 border-black rounded-lg py-2 px-4 my-2"
                >
                  <MissingListItem {...missings[missing]} />
                  <div className="flex justify-center">
                    <button
                      className="bg-red-300 p-2 rounded-md"
                      onClick={() => deleteMissingPost(missing)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      ) : null}
    </main>
  );
};

export default Page;
