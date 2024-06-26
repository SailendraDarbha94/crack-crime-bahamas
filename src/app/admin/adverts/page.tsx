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
import AdvertChanger from "./AdvertChanger";
const Page = () => {
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
      console.log(extensionArr);
      const extension = extensionArr[extensionArr.length - 1];

      console.log(extension);
      const storageRef = ref(
        storage,
        `/adverts/home/advertisement.${extension}`
      );
      const { metadata } = await uploadBytes(storageRef, selectedFile);
      console.log(metadata);
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
      updates["/adverts/home/"] = {
        path: metadata.fullPath,
      };
      await update(dbRef(db), updates);
      setSelectedFile(null);
      setLoading(false);
      fetchHomePageAvdvert();
    } catch (err) {
      setLoading(false);
      console.log(JSON.stringify(err));
    }
  };

  const [homePageAvdvert, setHomePageAdvert] = useState<string>("");

  const fetchHomePageAvdvert = async () => {
    setLoading(true);
    console.log(homePageAvdvert);
    try {
      const databaseRef = dbRef(db);
      const data = await get(child(databaseRef, "adverts/home"));
      if (data.exists()) {
        const { path } = data.val();
        const storageRef = ref(storage, path);
        const arrayBuffer = await getBytes(storageRef);
        const blob = new Blob([arrayBuffer], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setHomePageAdvert(url);
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
    fetchHomePageAvdvert();
  }, []);
  return (
    <div className="w-full font-nunito">
      <h1 className="text-2xl font-semibold">Manage Advertisement Images</h1>
      <div className="flex flex-wrap w-full justify-evenly">
        <AdvertChanger group="home" />
        <AdvertChanger group="emergency" />
        <AdvertChanger group="whoWeAre" />
      </div>
    </div>
  );
};

export default Page;
