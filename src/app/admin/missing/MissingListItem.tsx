"use client";

import app from "@/lib/firebase";
import { getBytes, getStorage, ref } from "firebase/storage";
import { useEffect, useState } from "react";

const MissingListItem = ({ name, age, gender, id, alias, image }: any) => {
  const [imager, setImager] = useState<string>("");
  const storage = getStorage(app);
  const storageRef = ref(storage, image);

  const getImage = async () => {
    try {
        const arrayBuffer = await getBytes(storageRef);
        const blob = new Blob([arrayBuffer], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setImager(url);
    } catch (err) {
        setImager("/newFavicon.png")
        console.log(JSON.stringify(err))
    }
  };

  useEffect(() => {
    getImage();
  }, []);

  return (
    <div className="p-2 flex rounded-xl max-h-40 w-full min-h-20">
      <div className="w-1/2">
        <p>Name : {name}</p>
        <p>Id : {id}</p>
        <p>Age : {age}</p>
        <p>Gender : {gender}</p>
        <p>Alias : {alias}</p>
      </div>
      <div className="w-1/2">
        <img src={imager} alt="missing person" className="max-h-full mx-auto" />
        <h3 className="text-center">{image == "Image Not Available" ? "Image Not Uploaded" : null}</h3>
      </div>
    </div>
  );
};

export default MissingListItem;
