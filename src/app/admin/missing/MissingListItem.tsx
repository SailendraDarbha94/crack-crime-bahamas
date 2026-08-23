"use client";

import { StorageService } from "@/lib/firebaseService";
import { useEffect, useState } from "react";

interface MissingListItemProps {
  name: string;
  age: number | string;
  gender: string;
  id: string;
  alias: string;
  image: string;
  kind?: "missing" | "wanted";
}

const MissingListItem = ({ name, age, gender, alias, image, kind = "missing" }: MissingListItemProps) => {
  const [imager, setImager] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const getImage = async () => {
      try {
        setLoading(true);
        if (image === "Image Not Available" || !image) {
          if (!cancelled) setImager("/newfavicon.png");
          return;
        }

        const url = await StorageService.createBlobURL(image);
        objectUrl = url;
        if (!cancelled) setImager(url);
      } catch (err) {
        console.warn(`Image not found for ${name}:`, err);
        if (!cancelled) setImager("/newfavicon.png");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    getImage();

    // Revoke the blob URL created by THIS effect run (not a stale one)
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [image, name]);

  return (
    <div className="p-2 flex rounded-xl max-h-40 w-full min-h-20">
      <div className="w-1/2">
        <p>Name: {name}</p>
        <p>Age: {age}</p>
        <p>Gender: {gender}</p>
        <p>Alias: {alias}</p>
      </div>
      <div className="w-1/2 flex flex-col items-center">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800"></div>
          </div>
        ) : (
          <>
            <img
              src={imager}
              alt={`${kind === "wanted" ? "Wanted" : "Missing"} person: ${name}`}
              className="max-h-32 mx-auto object-cover rounded"
              onError={() => setImager("/newfavicon.png")}
            />
            {image === "Image Not Available" && (
              <h3 className="text-center text-sm text-amber-900/70 mt-1">
                Image Not Uploaded
              </h3>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MissingListItem;
