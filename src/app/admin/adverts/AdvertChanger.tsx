"use client";
import { useEffect, useState } from "react";
import { advertImages, heroImages } from "@/lib/firebaseService";
import { useToast } from "@/lib/toastContext";
import { Button } from "@nextui-org/react";

interface AdvertChangerProps {
  group: string;
  label?: string;
  where?: string;
  aspect?: string;
  /** Which fixed-path image store this slot manages (default: advert slots). */
  variant?: "advert" | "hero";
}

const AdvertChanger = ({ group, label, where, aspect, variant = "advert" }: AdvertChangerProps) => {
  const store = variant === "hero" ? heroImages : advertImages;
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [advertisement, setAdvertisement] = useState<string>("");

  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast({ message: 'Please select a valid image file (JPEG, PNG, or GIF)', type: "error" });
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({ message: 'File size must be less than 5MB', type: "error" });
        return;
      }

      setSelectedFile(file);
    }
  };

  const uploadAdvertisement = async () => {
    if (!selectedFile) {
      toast({ message: 'Please select a file first', type: "warning" });
      return;
    }

    setUploading(true);

    try {
      await store.upload(group, selectedFile);
      setSelectedFile(null);
      await fetchAdvertisement();
      toast({ message: `${label ?? group} image uploaded successfully`, type: "success" });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ message: 'Upload failed. Please try again.', type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const fetchAdvertisement = async () => {
    setLoading(true);
    try {
      const url = await store.get(group);
      setAdvertisement(url || "");
    } catch (error) {
      console.error('Error fetching advertisement:', error);
      setAdvertisement("");
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
  };

  useEffect(() => {
    fetchAdvertisement();
  }, [group]);
  return (
    <main className="my-4 text-amber-950 w-full sm:w-auto">
      <div className="bg-white/25 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(120,72,10,0.12)] w-full h-full font-nunito p-4 rounded-2xl max-w-md mx-auto">
        <div className="text-center mb-2">
          <p className="text-xl font-bold text-amber-950">
            {label ?? group}
            {aspect ? (
              <span className="ml-2 align-middle text-xs font-semibold bg-white/40 border border-white/60 rounded-full px-2 py-0.5 text-amber-900">
                {aspect}
              </span>
            ) : null}
          </p>
          {where ? <p className="text-sm text-amber-900/70">{where}</p> : null}
        </div>
        {loading ? (
          <div
            role="status"
            className="flex justify-center min-h-40 items-center"
          >
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-800"></div>
            <span className="sr-only">Loading...</span>
          </div>
        ) : (
          <div>
            <div className="border border-white/50 bg-white/20 rounded-xl min-h-20 p-2 flex flex-wrap items-center justify-center">
              <h1 className="w-full mb-2">
                {advertisement === ""
                  ? "No advertisement uploaded yet"
                  : "Current Advertisement :"}
              </h1>
              {advertisement !== "" && (
                <div>
                  <img
                    src={advertisement}
                    alt={`Current ${group} advertisement`}
                    className=" max-h-40"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
            <div className="min-h-20 py-3">
              <label className="block" htmlFor="advertFileUpload">
                To Change Advertisement
              </label>
              {selectedFile ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-600">{selectedFile.name} selected</p>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-red-600 underline"
                  >
                    Clear selection
                  </button>
                </div>
              ) : (
                <input
                  onChange={handleFileChange}
                  required={true}
                  id="advertFileUpload"
                  name="advertFileUpload"
                  type="file"
                  accept="image/*"
                  className="block"
                />
              )}
            </div>
            <br />
            <Button
              onClick={uploadAdvertisement}
              disabled={uploading || !selectedFile}
              variant="flat"
              className="rounded-xl block mx-auto px-5 py-2 font-bold bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {uploading ? 'UPLOADING...' : 'UPLOAD'}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default AdvertChanger;
