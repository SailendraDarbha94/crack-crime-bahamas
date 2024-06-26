"use client";

import app from "@/lib/firebase";
import { useEffect, useState } from "react";
import { child, get, getDatabase, ref, remove } from "firebase/database";
import { useRouter } from "next/navigation";
import AddWanted from "./AddWanted";
import MissingListItem from "../missing/MissingListItem";
import { deleteObject, getStorage, ref as StorageRef } from "firebase/storage";

const Page = () => {
  const [showWanted, setShowWanted] = useState<boolean>(false);
  const [addWanted, setAddWanted] = useState<boolean>(false);
  const [wantedIndices, setWantedIndices] = useState<any[] | null>(null);
  const [wanteds, setWanteds] = useState<any>(null);

  const fetchWantedPersons = async () => {
    try {
      const db = getDatabase(app);
      const dbRef = await ref(db);
      const data = await get(child(dbRef, "wanteds"));
      if (data.exists()) {
        const wanteds = await data.val();
        const indices = Object.keys(wanteds);

        setWanteds(wanteds);
        setWantedIndices(indices);
      }
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  };

  const deleteWantedPost = async (id: string, path: string) => {
    try {
      const db = getDatabase(app);
      const postRef = ref(db, `wanteds/${id}`);
      const storage = getStorage(app);
      const imageRef = StorageRef(storage, path);
      await deleteObject(imageRef);
      await remove(postRef);
      console.log("post deleted successfullyy");
      fetchWantedPersons();
    } catch (err) {
      console.log("could not delete_______", JSON.stringify(err));
    }
  };

  useEffect(() => {
    fetchWantedPersons();
  }, []);

  return (
    <main className="font-nunito py-3">
      <h1 className="text-3xl border-b-2 border-black">Missing Persons</h1>
      <div className="flex p-2 mb-4 justify-around">
        <button
          className="bg-purple-200 dark:bg-slate-500 p-2 rounded-lg"
          onClick={() => setShowWanted(!showWanted)}
        >
          {showWanted ? "Hide Wanted Persons" : "Show Wanted Persons"}
        </button>
        <button
          className="bg-purple-200 dark:bg-slate-500 p-2 rounded-lg"
          onClick={() => setAddWanted(!addWanted)}
        >
          {addWanted ? "Hide Wanted Form" : "Add Wanted Suspect"}
        </button>
      </div>
      <div className=" min-h-fit">{addWanted ? <AddWanted /> : null}</div>
      {showWanted ? (
        <div className="w-full">
          {wantedIndices &&
            wantedIndices.map((wanted) => {
              return (
                <div
                  key={wanted}
                  className="border-2 border-black rounded-lg py-2 px-4 my-2"
                >
                  <MissingListItem {...wanteds[wanted]} />
                  <div className="flex justify-center">
                    <button
                      className="bg-red-300 p-2 rounded-md"
                      onClick={() =>
                        deleteWantedPost(wanted, wanteds[wanted].image)
                      }
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
