"use client";

import app from "@/lib/firebase";
import { useEffect, useState } from "react";
import AddMissing from "./AddMissing";
import { child, get, getDatabase, ref } from "firebase/database";

const Page = () => {
  const [showMissing, setShowMissing] = useState<boolean>(false);
  const [addMissing, setAddMissing] = useState<boolean>(false);
  const [missingIndices, setMissingIndices] = useState<any[] | null>(null);
  const [missings, setMissings] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const fetchMissingPersons = async () => {
    try {
      const db = getDatabase(app);
      const dbRef = await ref(db);
      const data = await get(child(dbRef, "missings"));
      if (data.exists()) {
        const missings = await data.val();
        setMissings(missings);
        setMissingIndices(Object.keys(missings));
      }
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  };

  useEffect(() => {
    fetchMissingPersons();
  },[]);


  return (
    <main className="font-nunito py-3">
      <h1 className="text-3xl border-b-2 border-black">Missing Persons</h1>
      <div className="flex p-2 mb-4 justify-around">
        <button
          className="bg-purple-200 dark:bg-slate-500 p-2 rounded-lg"
          onClick={() => setShowMissing(!showMissing)}
        >
          Show Missing Persons List
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
          {missingIndices && missingIndices.map((missing) => {
            return (
              <div key={missing}>
                <p>{missings[missing].name}</p>
              </div>
            )
          })}
        </div>
      ):null}
    </main>
  );
};

export default Page;
