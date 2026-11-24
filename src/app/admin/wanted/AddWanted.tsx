"use client";

import { BUTTON_SOLID_BLOCK, BUTTON_SOLID_SM } from "@/components/ui/buttonStyles";
import { WantedPersonService } from "@/lib/firebaseService";
import { FirebaseErrorHandler } from "@/lib/firebaseErrorHandler";
import { useToast } from "@/lib/toastContext";
import { useState } from "react";
import { Input, Textarea } from "@nextui-org/react";

/** A listed person as the page holds them, for editing. */
export interface EditableWantedPerson {
  id: string;
  name?: unknown;
  wanted_for?: unknown;
  age?: unknown;
  gender?: unknown;
  alias?: unknown;
  description?: unknown;
  last_known_address?: unknown;
  image?: unknown;
}

interface AddWantedProps {
  onSuccess?: () => void;
  /** When given, the form edits this person instead of adding a new one. */
  person?: EditableWantedPerson;
  /** Called when the person being edited turns out to have been archived or deleted meanwhile. */
  onGone?: () => void;
}

/** A stored field as the text the form shows: older records may hold a number for the age. */
const asText = (value: unknown): string =>
  typeof value === "string" ? value : typeof value === "number" && Number.isFinite(value) ? String(value) : "";

const AddWanted = ({ onSuccess, person, onGone }: AddWantedProps) => {
  const editing = person !== undefined;
  const [wantedFor, setWantedFor] = useState<string>(asText(person?.wanted_for));
  const [name, setName] = useState<string>(asText(person?.name));
  const [age, setAge] = useState<string>(asText(person?.age));
  const [last_known_address, setLastKnownAddress] = useState<string>(asText(person?.last_known_address));
  const [gender, setGender] = useState<string>(asText(person?.gender));
  const [alias, setAlias] = useState<string>(asText(person?.alias));
  const [description, setDescription] = useState<string>(asText(person?.description));
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { toast } = useToast();

  const registerWantedPerson = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ message: "Name is required", type: "error" });
      return;
    }

    if (!wantedFor.trim()) {
      toast({ message: "'Wanted For' field is required", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const personData = {
        name: name.trim(),
        wanted_for: wantedFor.trim(),
        age: age.trim(),
        gender: gender.trim(),
        alias: alias.trim(),
        last_known_address: last_known_address.trim(),
        description: description.trim(),
      };

      if (person) {
        // Only what was changed in this window is written, and the picture
        // only if a new one was chosen. A field left as it was opened is not
        // sent at all, so a correction another admin has made to it since
        // this page loaded is not undone.
        const changes: Partial<typeof personData> = {};
        for (const key of Object.keys(personData) as (keyof typeof personData)[]) {
          if (personData[key] !== asText(person[key]).trim()) changes[key] = personData[key];
        }
        if (Object.keys(changes).length === 0 && !selectedFile) {
          toast({ message: "Nothing was changed, so there is nothing to save", type: "warning" });
          return;
        }
        await WantedPersonService.updateWantedPerson(person.id, changes, selectedFile || undefined);
        setSelectedFile(null);
        toast({ message: "Changes saved", type: "success" });
        onSuccess?.();
        return;
      }

      // The service writes the full record (image, created_at, country_code,
      // current_status) — no second API write needed.
      await WantedPersonService.createWantedPerson(personData, selectedFile || undefined);

      // Reset form
      setName("");
      setWantedFor("");
      setAge("");
      setAlias("");
      setGender("");
      setLastKnownAddress("");
      setDescription("");
      setSelectedFile(null);

      toast({ message: "Wanted person registered successfully!", type: "success" });

      // Call the onSuccess callback to refresh the list
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      const userFriendlyMessage = FirebaseErrorHandler.handleError(err);
      toast({ message: userFriendlyMessage, type: "error" });
      console.error(person ? "Saving the changes failed:" : "Registration failed:", err);
      // Another admin archived or deleted this person since the list loaded:
      // there is nothing left to save to, so show the list as it is now.
      if (person && /no longer listed/.test(userFriendlyMessage)) onGone?.();
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
      // "Less than", as the storage rules have it: a file of exactly 5 MB
      // would pass a looser check here and then be refused on upload.
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size >= maxSize) {
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
          <div className="w-full bg-white rounded-lg md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-4 md:p-6 space-y-4 md:space-y-6 sm:p-8 w-fu">
              <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                {editing ? "Edit Wanted Person" : "Wanted Person Report"}
              </h1>
              <form className="space-y-2" onSubmit={registerWantedPerson}>
                <div>
                  <Input label="Name" type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} isRequired />
                </div>
                <div>
                  <Textarea className="max-w-full" value={wantedFor} id="wantedFor" isRequired onChange={(e) => setWantedFor(e.target.value)} label="Wanted For" placeholder="" />
                </div>
                <div>
                  <Input label="Age" type="text" id="age" value={age} onChange={(e) => setAge(e.target.value)} />
                </div>
                <div>
                  <Input label="Visual Description" type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div>
                  <Input label="Gender" type="text" id="gender" value={gender} onChange={(e) => setGender(e.target.value)} />
                </div>
                <div>
                  <Input label="Known Aliases" type="text" id="alias" value={alias} onChange={(e) => setAlias(e.target.value)} />
                </div>
                <div>
                  <Input label="Last Known Address" type="text" id="address" value={last_known_address} onChange={(e) => setLastKnownAddress(e.target.value)} />
                </div>
                <div>
                  <label
                    htmlFor="imager"
                    className="block mb-2 text-sm text-center pt-4 font-medium text-gray-900"
                  >
                    {editing ? "Replace the picture (optional)" : "Image"}
                  </label>
                  {editing && !selectedFile ? (
                    <p className="text-xs text-gray-600 text-center mb-2">
                      {typeof person?.image === "string" && person.image && person.image !== "Image Not Available"
                        ? "The current picture is kept unless you choose a new one."
                        : "There is no picture yet. You can add one here."}
                    </p>
                  ) : null}

                  {selectedFile ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-600 text-center">Selected file: {selectedFile.name}</p>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={clearFileSelection}
                          className={BUTTON_SOLID_SM}
                        >
                          Clear selection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Input label="" type="file" id="imager" accept="image/*" onChange={handleFileChange} />
                  )}
                </div>
                {loading ? (
                  <div role="status" className="flex justify-center">
                    <svg
                      aria-hidden="true"
                      className="w-8 h-8 text-gray-200 animate-spin fill-amber-600"
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
                    className={BUTTON_SOLID_BLOCK}
                  >
                    {editing ? "Save changes" : "Submit"}
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
