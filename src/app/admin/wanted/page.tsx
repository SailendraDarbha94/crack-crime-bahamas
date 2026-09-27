"use client";

import { PersonArchiveService, WantedPersonService } from "@/lib/firebaseService";
import ArchivePrompt from "@/components/ArchivePrompt";
import app from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { FirebaseErrorHandler } from "@/lib/firebaseErrorHandler";
import { useToast } from "@/lib/toastContext";
import { useEffect, useState } from "react";
import AddWanted from "./AddWanted";
import MissingListItem from "../missing/MissingListItem";
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";

import { Button } from "@nextui-org/react";

interface WantedPerson {
  id: string;
  name: string;
  age: string | number;
  gender: string;
  alias: string;
  image: string;
  wanted_for: string;
  last_known_address: string;
  description: string;
  created_at: number;
  current_status: string;
}

const Page = () => {
  const [showWanted, setShowWanted] = useState<boolean>(false);
  const [wanteds, setWanteds] = useState<WantedPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { toast } = useToast();

  const fetchWantedPersons = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Starting to fetch wanted persons...');

      // THE COMMENTED PIECE OF CODE BELOW DOES NOT WORK
      // Test database connection first
      // const isConnected = await DatabaseService.testConnection();
      // if (!isConnected) {
      //   throw new Error('Database connection failed');
      // }

      const wantedPersons = await WantedPersonService.getAllWantedPersons();
      setWanteds(wantedPersons);
    } catch (err) {
      const errorMessage = FirebaseErrorHandler.handleError(err);
      setError(errorMessage);
      console.error("Error fetching wanted persons:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteWantedPost = async (id: string, imagePath: string, personName: string) => {
    if (!confirm(`Are you sure you want to delete the wanted person report for ${personName}?`)) {
      return;
    }

    try {
      await WantedPersonService.deleteWantedPerson(id, imagePath);

      // Refresh the list
      await fetchWantedPersons();

      toast({ message: "Wanted person report deleted successfully", type: "success" });
    } catch (err) {
      const errorMessage = FirebaseErrorHandler.handleError(err);
      toast({ message: `Could not delete: ${errorMessage}`, type: "error" });
      console.error("Could not delete:", err);
      // Someone else archived or deleted this person since the list loaded.
      if (/no longer listed/.test(errorMessage)) await fetchWantedPersons();
    }
  };

  // Archiving moves the record to the admin-only archive with the remarks,
  // which takes the person off the website, the police portal and the app
  // at once. The picture stays, so a restore brings them back unchanged.
  const archivePost = async (id: string, remarks: string) => {
    const admin = getAuth(app).currentUser;
    if (!admin) {
      toast({ message: "Your session has expired — please sign in again.", type: "error" });
      return;
    }
    setBusy(true);
    try {
      await PersonArchiveService.archive("wanteds", id, admin.uid, remarks);
      setArchivingId(null);
      await fetchWantedPersons();
      toast({ message: "Archived and removed from the public list. Find them under Archive.", type: "success" });
    } catch (err) {
      const errorMessage = FirebaseErrorHandler.handleError(err);
      toast({ message: `Could not archive: ${errorMessage}`, type: "error" });
      console.error("Could not archive:", err);
      // A card that has gone stale (another admin archived or deleted this
      // person) is the one failure a retry cannot fix: refresh the list.
      if (/no longer listed/.test(errorMessage)) {
        setArchivingId(null);
        await fetchWantedPersons();
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchWantedPersons();
  }, []);

  return (
    <main className="font-nunito py-3 m-2 rounded-3xl">
      <h1 className="text-2xl font-bold rounded-3xl border border-white/50 bg-white/25 backdrop-blur-md py-2 text-center text-amber-950 shadow-sm">Wanted Persons</h1>
      <div className="flex p-2 mb-4 justify-around">
        <Button
          className="font-bold text-lg"
          variant="flat"
          color="primary"
          onClick={() => setShowWanted(!showWanted)}
        >
          {showWanted ? "Hide Wanted Persons" : "Show Wanted Persons"}
        </Button>
        <Button variant="ghost" color="warning" className="font-bold text-lg" onPress={onOpen}>
          Add Suspect
        </Button>
      </div>
      <Modal className="max-h-full" isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalBody>
                <AddWanted onSuccess={() => fetchWantedPersons()} />
              </ModalBody>
              <ModalFooter>
                <Button color="secondary" variant="solid" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {showWanted && (
        <div className="w-full">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
            </div>
          ) : error ? (
            <div className="text-red-800 text-center py-4">
              Error: {error}
              <button
                onClick={fetchWantedPersons}
                className="block mx-auto mt-2 bg-white/35 backdrop-blur-md border border-white/60 text-amber-950 px-4 py-2 rounded-xl hover:bg-white/50 transition-all duration-200 shadow-sm"
              >
                Retry
              </button>
            </div>
          ) : wanteds.length === 0 ? (
            <div className="text-center py-8 text-amber-900/70">
              No wanted persons reported
            </div>
          ) : (
            wanteds.map((wanted) => (
              <div
                key={wanted.id}
                className="bg-white/25 backdrop-blur-xl border border-white/50 text-amber-950 rounded-3xl py-2 px-4 my-2 shadow-[0_4px_16px_rgba(120,72,10,0.12)]"
              >
                <MissingListItem
                  name={wanted.name}
                  age={typeof wanted.age === 'string' ? parseInt(wanted.age) || 0 : wanted.age}
                  gender={wanted.gender}
                  id={wanted.id}
                  alias={wanted.alias}
                  image={wanted.image}
                  kind="wanted"
                />
                <div className="mt-2 p-2 bg-white/30 border border-white/50 rounded-xl">
                  <h4 className="font-semibold text-red-700">Wanted For:</h4>
                  <p className="text-sm text-amber-900/90">{wanted.wanted_for}</p>
                  {wanted.description && (
                    <>
                      <h4 className="font-semibold mt-2 text-amber-800">Description:</h4>
                      <p className="text-sm text-amber-900/90">{wanted.description}</p>
                    </>
                  )}
                  {wanted.last_known_address && (
                    <>
                      <h4 className="font-semibold mt-2 text-amber-800">Last Known Address:</h4>
                      <p className="text-sm text-amber-900/90">{wanted.last_known_address}</p>
                    </>
                  )}
                </div>
                {archivingId === wanted.id ? (
                  <div className="my-4">
                    <ArchivePrompt
                      id={wanted.id}
                      title={`Archive ${wanted.name}`}
                      hint="They come off the website, the police portal and the app straight away. Restoring from the Archive page brings them back unchanged."
                      busy={busy}
                      onConfirm={(remarks) => archivePost(wanted.id, remarks)}
                      onCancel={() => setArchivingId(null)}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center gap-3">
                    <button
                      className="bg-white/40 border border-white/60 hover:bg-white/55 text-amber-950 my-4 font-bold px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ease-out transform active:scale-95 disabled:opacity-50"
                      onClick={() => setArchivingId(wanted.id)}
                      disabled={busy}
                    >
                      ARCHIVE
                    </button>
                    <button
                      className="bg-red-600/90 my-4 font-bold backdrop-blur-sm hover:bg-red-500/90 text-white hover:border-red-300/50 relative px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ease-out transform active:scale-95 disabled:opacity-50"
                      onClick={() => deleteWantedPost(wanted.id, wanted.image, wanted.name)}
                      disabled={busy}
                    >
                      DELETE
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
};

export default Page;
