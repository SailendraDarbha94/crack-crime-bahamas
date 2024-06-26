"use client";
import app from "@/lib/firebase";
import {
  getDatabase,
  ref as dbRef,
  child,
  update,
  get,
} from "firebase/database";
import { getBytes, getStorage, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
const AdvertChanger = ({ group }: { group: string }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const db = getDatabase(app);
  const storage = getStorage(app);
  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const fileSaver = async () => {
    if (selectedFile) {
      console.log(selectedFile.name);
      const extensionArr = selectedFile.name.split(".");

      const extension = extensionArr[extensionArr.length - 1];

      const storageRef = ref(
        storage,
        `/adverts/${group}/advertisement.${extension}`
      );
      const { metadata } = await uploadBytes(storageRef, selectedFile);

      return metadata;
    } else {
      return false;
    }
  };

  const advertChanger = async () => {
    setLoading(true);
    try {
      const metadata = await fileSaver();
      if (!metadata) {
        throw new Error("Upload Failed");
      }
      const updates: any = {};
      updates[`/adverts/${group}/`] = {
        path: metadata.fullPath,
      };
      await update(dbRef(db), updates);
      setSelectedFile(null);
      setLoading(false);
      fetchAdvertisement();
    } catch (err) {
      setLoading(false);
      console.log(JSON.stringify(err));
    }
  };

  const [advertisement, setAdvertisement] = useState<string>("");

  const fetchAdvertisement = async () => {
    setLoading(true);
    try {
      const databaseRef = dbRef(db);
      const data = await get(child(databaseRef, `adverts/${group}`));
      if (data.exists()) {
        const { path } = data.val();
        const storageRef = ref(storage, path);
        const arrayBuffer = await getBytes(storageRef);
        const blob = new Blob([arrayBuffer], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setAdvertisement(url);
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      console.log("ERROR _________", JSON.stringify(err));
    }
  };

  useEffect(() => {
    fetchAdvertisement();
  }, []);
  return (
    <main className="">
      <div className="dark:bg-white dark:text-black w-full font-nunito border-2 border-black p-4 rounded-xl max-w-md my-2 mx-auto">
        <p className=" uppercase  text-xl font-bold text-center">{group} screens</p>
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
          <div>
            <div className="border-2 border-double border-black rounded-lg min-h-20 p-2 flex flex-wrap items-center justify-center">
              <h1 className="w-full mb-2">
                {advertisement === ""
                  ? "cannot load advertisement image"
                  : "Current Advertisement :"}
              </h1>
              <div>
                <img
                  src={advertisement}
                  alt="Advertisement Image"
                  className=" max-h-40"
                />
              </div>
            </div>
            <div className="min-h-20 py-3">
              <label className="block" htmlFor="advertFileUpload">
                To Change Advertisement
              </label>
              {selectedFile ? (
                <p>{selectedFile.name} selected</p>
              ) : (
                <input
                  onChange={handleFileChange}
                  required={true}
                  id="advertFileUpload"
                  name="advertFileUpload"
                  type="file"
                  className="block"
                />
              )}
            </div>
            <br />
            <button
              onClick={advertChanger}
              className="rounded-lg block mx-auto p-2 font-extrabold bg-blue-600 text-white"
            >
              UPLOAD
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default AdvertChanger;
