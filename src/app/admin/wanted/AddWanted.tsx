"use client";

import app from "@/lib/firebase";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";

const AddWanted = () => {
  const [wantedFor, setWantedFor] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [last_known_address, setLastKnownAddress] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [alias, setAlias] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const fileNameChecker = async (fileName: string | null) => {
    if (!fileName) {
      return false;
    }
    const fileRef = await ref(storage, `/wanteds/${fileName}`);
    const result = await getDownloadURL(fileRef).catch((err) => {
      console.log(JSON.stringify(err));
    });
    if (result) {
      return true;
    } else {
      return false;
    }
  };

  const fileSaver = async () => {
    if (selectedFile) {
      const storageRef = ref(storage, `/wanteds/${selectedFile.name}`);
      const { metadata } = await uploadBytes(storageRef, selectedFile);
      return metadata;
    } else {
      return false;
    }
  };

  const storage = getStorage(app);


  const registerWantedPerson = async (e:any) => {
    e.preventDefault();
    setLoading(true);
    let noImageMessage = "Image Not Available";
    try {
      const currentTime = Date.now();
      const fileExists = await fileNameChecker(
        selectedFile ? selectedFile.name : null
      );
      if (fileExists) {
        throw new Error("Picture is duplicate");
      }
      const metaData = await fileSaver()
      const res = await fetch("/api/wanted", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          wanted_for: wantedFor,
          age: age,
          gender: gender,
          alias: alias,
          created_at: currentTime,
          country_code: "BAH",
          current_status: "",
          description: description,
          last_known_address: last_known_address,
          image: metaData ? metaData.fullPath : noImageMessage,
        }),
      });

      const data = await res.json();

      if (data !== "request failure") {
        console.log(data);
        setName("");
        setAge("");
        setAlias("");
        setGender("");
        setWantedFor("");
        setLastKnownAddress("");
        setDescription("");
        setSelectedFile(null);
        setLoading(false);
      }
      setLoading(false);
    } catch (err) {
      setName("");
      setWantedFor("");
      setAge("");
      setAlias("");
      setGender("");
      setDescription("");
      setLastKnownAddress("");
      setSelectedFile(null);
      console.error(err);
      setLoading(false);
    }
  };

  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };
  return (
    <div className="p-4 pt-14">
      <section className="font-nunito mb-10 mx-auto max-w-lg rounded-lg">
        <div className="flex flex-col items-center justify-center px-3 md:px-8 mx-auto md:h-screen lg:py-0">
          <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-4 md:p-6 space-y-4 md:space-y-6 sm:p-8 w-fu">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                Wanted Person Report
              </h1>
              <form className="space-y-2" onSubmit={registerWantedPerson}>
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={name}
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder=""
                    required={true}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="wantedFor"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Wanted For
                  </label>
                  <textarea
                    name="wantedFor"
                    id="wantedFor"
                    value={wantedFor}
                    className="bg-gray-50 border h-24 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder=""
                    required={true}
                    onChange={(e) => setWantedFor(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="age"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Age of the Suspect
                  </label>
                  <input
                    type="age"
                    name="age"
                    id="age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder=""
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required={false}
                  />
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Description
                  </label>
                  <input
                    type="description"
                    name="description"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder=""
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required={false}
                  />
                </div>
                <div>
                  <label
                    htmlFor="gender"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Gender of the Suspect
                  </label>
                  <input
                    type="text"
                    name="gender"
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder=""
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required={false}
                  />
                </div>
                <div>
                  <label
                    htmlFor="alias"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Known Aliases
                  </label>
                  <input
                    type="text"
                    name="alias"
                    id="alias"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder=""
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required={false}
                  />
                </div>
                <div>
                  <label
                    htmlFor="last_known_address"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Last Known Address
                  </label>
                  <input
                    type="text"
                    name="last_known_address"
                    id="last_known_address"
                    value={last_known_address}
                    onChange={(e) => setLastKnownAddress(e.target.value)}
                    placeholder=""
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required={false}
                  />
                </div>
                <div>
                  <label
                    htmlFor="imager"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Image
                  </label>

                  {selectedFile ? (
                    <p>Selected file: {selectedFile.name}</p>
                  ) : (
                    <input
                      type="file"
                      id="imager"
                      onChange={handleFileChange}
                      placeholder="Upload IMage"
                      className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      required={true}
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

export default AddWanted;
