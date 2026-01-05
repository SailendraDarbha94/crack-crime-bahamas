"use client";

import { StorageService } from "@/lib/firebaseService";
import { useEffect, useState } from "react";

interface MissingListItemProps {
  name: string;
  age: number;
  gender: string;
  id: string;
  alias: string;
  image: string;
}

const MissingListItem = ({ name, age, gender, id, alias, image }: MissingListItemProps) => {
  const [imager, setImager] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const getImage = async () => {
    try {
      setLoading(true);
      if (image === "Image Not Available" || !image) {
        setImager("/newfavicon.png");
        return;
      }
      
      // Use the new StorageService to create blob URL
      const url = await StorageService.createBlobURL(image);
      setImager(url);
    } catch (err) {
      console.warn(`Image not found for ${name}:`, err);
      setImager("/newfavicon.png");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getImage();
    
    // Cleanup blob URL when component unmounts
    return () => {
      if (imager && imager.startsWith('blob:')) {
        URL.revokeObjectURL(imager);
      }
    };
  }, [image]);

  return (
    <div className="p-2 flex rounded-xl max-h-40 w-full min-h-20">
      <div className="w-1/2">
        <p>Name: {name}</p>
        <p>Id: {id}</p>
        <p>Age: {age}</p>
        <p>Gender: {gender}</p>
        <p>Alias: {alias}</p>
      </div>
      <div className="w-1/2 flex flex-col items-center">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <img 
              src={imager} 
              alt={`Missing person: ${name}`} 
              className="max-h-32 mx-auto object-cover rounded"
              onError={() => setImager("/newfavicon.png")}
            />
            {image === "Image Not Available" && (
              <h3 className="text-center text-sm text-gray-500 mt-1">
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
