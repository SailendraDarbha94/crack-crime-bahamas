"use client";
import { MissingPersonService } from "@/lib/firebaseService";
import { FirebaseErrorHandler } from "@/lib/firebaseErrorHandler";
import { useToast } from "@/lib/toastContext";
import { useState } from "react";
import { Input, Textarea } from "@nextui-org/react";

interface AddMissingProps {
  onSuccess?: () => void;
}

const AddMissing = ({ onSuccess }: AddMissingProps) => {
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [last_known_address, setLastKnownAddress] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [alias, setAlias] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { toast } = useToast();

  const registerMissingPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ message: "Name is required", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const personData = {
        name: name.trim(),
        age: age.trim(),
        gender: gender.trim(),
        alias: alias.trim(),
        last_known_address: last_known_address.trim(),
        description: description.trim(),
      };

      // Use the new MissingPersonService
      const id = await MissingPersonService.createMissingPerson(personData, selectedFile || undefined);
      
      // Also call your API endpoint to sync with your database
      const res = await fetch("/api/missing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...personData,
          created_at: Date.now(),
          country_code: "BAH",
          current_status: "",
          image: selectedFile ? `missings/${selectedFile.name}` : "Image Not Available",
        }),
      });

      const data = await res.json();
      if (data === "request failure") {
        throw new Error("API request failed");
      }

      console.log("Missing person registered successfully:", { id, apiResponse: data });
      
      // Reset form
      setName("");
      setAge("");
      setAlias("");
      setGender("");
      setLastKnownAddress("");
      setDescription("");
      setSelectedFile(null);
      
      toast({ message: "Missing person registered successfully!", type: "success" });
      
      // Call the onSuccess callback to refresh the list
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      const userFriendlyMessage = FirebaseErrorHandler.handleError(err);
      toast({ message: userFriendlyMessage, type: "error" });
      console.error("Registration failed:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const clearFileSelection = () => {
    setSelectedFile(null);
  };

  return (
    <div className="w-full">
      <section className="font-nunito mx-auto max-w-lg rounded-lg">
        <div className="flex flex-col items-center justify-center mx-auto lg:py-0">
          <div className="w-full bg-white rounded-lg dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-4 md:p-6 space-y-4 md:space-y-6 sm:p-8 w-fu">
              <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                Missing Person Report
              </h1>
              <form className="space-y-2" onSubmit={registerMissingPerson}>
                <div>
                  <Input 
                    label="Name" 
                    type="text" 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    isRequired 
                  />
                </div>
                <div>
                  <Input 
                    label="Age of the Missing Person" 
                    type="text" 
                    id="age" 
                    value={age} 
                    onChange={(e) => setAge(e.target.value)} 
                  />
                </div>
                <div>
                  <Input 
                    label="Gender of the Missing Person" 
                    type="text" 
                    id="gender" 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)} 
                  />
                </div>
                <div>
                  <Input 
                    label="Known Aliases" 
                    type="text" 
                    id="alias" 
                    value={alias} 
                    onChange={(e) => setAlias(e.target.value)} 
                  />
                </div>
                <div>
                  <Textarea 
                    className="max-w-full" 
                    value={description} 
                    id="description" 
                    onChange={(e) => setDescription(e.target.value)} 
                    label="Description" 
                    placeholder="" 
                  />
                </div>
                <div>
                  <Input 
                    label="Last Known Address" 
                    type="text" 
                    id="last_known_address" 
                    value={last_known_address} 
                    onChange={(e) => setLastKnownAddress(e.target.value)} 
                  />
                </div>
                <div>
                  <label
                    htmlFor="imager"
                    className="block mb-2 text-sm text-center pt-4 font-medium text-gray-900 dark:text-white"
                  >
                    Image
                  </label>

                  {selectedFile ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-600 text-center">Selected file: {selectedFile.name}</p>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={clearFileSelection}
                          className="text-sm text-red-600 underline"
                        >
                          Clear selection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Input 
                      label="" 
                      type="file" 
                      id="imager" 
                      accept="image/*"
                      onChange={handleFileChange} 
                    />
                  )}
                </div>
                {loading ? (
                  <div role="status" className="flex justify-center">
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
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-slate-200 hover:bg-slate-300 dark:hover:bg-blue-700 dark:text-white focus:ring-4 dark:bg-blue-600 focus:outline-none font-medium text-lg px-5 py-2.5 text-center"
                  >
                    Submit
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AddMissing;
