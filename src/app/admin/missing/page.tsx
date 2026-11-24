"use client";

import { BUTTON, BUTTON_LG, BUTTON_SOLID } from "@/components/ui/buttonStyles";
import { PersonArchiveService, MissingPersonService } from "@/lib/firebaseService";
import ArchivePrompt from "@/components/ArchivePrompt";
import app from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { FirebaseErrorHandler } from "@/lib/firebaseErrorHandler";
import { useToast } from "@/lib/toastContext";
import { useEffect, useState } from "react";
import AddMissing, { type EditableMissingPerson } from "./AddMissing";
import MissingListItem from "./MissingListItem";
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";

interface MissingPerson {
  id: string;
  name: string;
  age: number;
  gender: string;
  alias: string;
  image: string;
  description: string;
  last_known_address: string;
  created_at: number;
  current_status: string;
}

const Page = () => {
  const [showMissing, setShowMissing] = useState<boolean>(false);
  const [missings, setMissings] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  // The person whose details are open for editing, or null.
  const [editingPerson, setEditingPerson] = useState<EditableMissingPerson | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const { toast } = useToast();

  const fetchMissingPersons = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Starting to fetch missing persons...');
      
      // THE COMMENTED PIECE OF CODE BELOW DOES NOT WORK
      // Test database connection first
      // const isConnected = await DatabaseService.testConnection();
      // if (!isConnected) {
      //   throw new Error('Database connection failed');
      // }
      
      const missingPersons = await MissingPersonService.getAllMissingPersons();
      setMissings(missingPersons);
    } catch (err) {
      const errorMessage = FirebaseErrorHandler.handleError(err);
      setError(errorMessage);
      console.error("Error fetching missing persons:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMissingPost = async (id: string, imagePath: string, personName: string) => {
    if (!confirm(`Are you sure you want to delete the missing person report for ${personName}?`)) {
      return;
    }

    try {
      await MissingPersonService.deleteMissingPerson(id, imagePath);

      // Refresh the list
      await fetchMissingPersons();

      toast({ message: "Missing person report deleted successfully", type: "success" });
    } catch (err) {
      const errorMessage = FirebaseErrorHandler.handleError(err);
      toast({ message: `Could not delete: ${errorMessage}`, type: "error" });
      console.error("Could not delete:", err);
      // Someone else archived or deleted this person since the list loaded.
      if (/no longer listed/.test(errorMessage)) await fetchMissingPersons();
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
      await PersonArchiveService.archive("missings", id, admin.uid, remarks);
      setArchivingId(null);
      await fetchMissingPersons();
      toast({ message: "Archived and removed from the public list. Find them under Archive.", type: "success" });
    } catch (err) {
      const errorMessage = FirebaseErrorHandler.handleError(err);
      toast({ message: `Could not archive: ${errorMessage}`, type: "error" });
      console.error("Could not archive:", err);
      // A card that has gone stale (another admin archived or deleted this
      // person) is the one failure a retry cannot fix: refresh the list.
      if (/no longer listed/.test(errorMessage)) {
        setArchivingId(null);
        await fetchMissingPersons();
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchMissingPersons();
  }, []);

  return (
    <main className="font-nunito py-3 m-2 rounded-3xl">
      <h1 className="text-2xl font-bold rounded-3xl border border-white/50 bg-white/25 backdrop-blur-md py-2 text-center text-amber-950 shadow-sm">Missing Persons</h1>
      <div className="flex p-2 mb-4 justify-around">
        <button type="button" className={BUTTON_LG} onClick={() => setShowMissing(!showMissing)}>
          {showMissing ? "Hide Missing Persons" : "Show Missing Persons"}
        </button>
        <button type="button" className={BUTTON_LG} onClick={onOpen}>
          Add Missing Person
        </button>
      </div>
      
      <Modal className="max-h-full" isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalBody>
                <AddMissing onSuccess={() => fetchMissingPersons()} />
              </ModalBody>
              <ModalFooter>
                <button type="button" className={BUTTON_SOLID} onClick={onClose}>
                  Close
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        className="max-h-full"
        isOpen={editingPerson !== null}
        onOpenChange={(open) => { if (!open) setEditingPerson(null); }}
        size="lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalBody>
                {editingPerson ? (
                  <AddMissing
                    key={editingPerson.id}
                    person={editingPerson}
                    // A save can outlive its window (the window can be closed,
                    // and another opened, while a picture uploads). When it
                    // finishes it may close only the window it was started
                    // from, never whichever one is open by then.
                    onSuccess={() => {
                      const opened = editingPerson;
                      setEditingPerson((current) => (current === opened ? null : current));
                      fetchMissingPersons();
                    }}
                    onGone={() => {
                      const opened = editingPerson;
                      setEditingPerson((current) => (current === opened ? null : current));
                      fetchMissingPersons();
                    }}
                  />
                ) : null}
              </ModalBody>
              <ModalFooter>
                <button type="button" className={BUTTON_SOLID} onClick={onClose}>
                  Close
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      {showMissing && (
        <div className="w-full">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
            </div>
          ) : error ? (
            <div className="text-red-800 text-center py-4">
              Error: {error}
              <button
                onClick={fetchMissingPersons}
                className={`${BUTTON} mx-auto mt-2`}
              >
                Retry
              </button>
            </div>
          ) : missings.length === 0 ? (
            <div className="text-center py-8 text-amber-900/70">
              No missing persons reported
            </div>
          ) : (
            missings.map((missing) => (
              <div
                key={missing.id}
                className="bg-white/25 backdrop-blur-xl border border-white/50 text-amber-950 rounded-3xl py-2 px-4 my-2 shadow-[0_4px_16px_rgba(120,72,10,0.12)]"
              >
                <MissingListItem 
                  name={missing.name}
                  age={missing.age}
                  gender={missing.gender}
                  id={missing.id}
                  alias={missing.alias}
                  image={missing.image}
                />
                {missing.description || missing.last_known_address ? (
                  <div className="mt-2 p-2 bg-white/30 border border-white/50 rounded-xl">
                    {missing.description ? (
                      <>
                        <h4 className="font-semibold text-amber-800">Description:</h4>
                        <p className="text-sm text-amber-900/90">{missing.description}</p>
                      </>
                    ) : null}
                    {missing.last_known_address ? (
                      <>
                        <h4 className={`font-semibold text-amber-800${missing.description ? " mt-2" : ""}`}>Last Known Address:</h4>
                        <p className="text-sm text-amber-900/90">{missing.last_known_address}</p>
                      </>
                    ) : null}
                  </div>
                ) : null}
                {archivingId === missing.id ? (
                  <div className="my-4">
                    <ArchivePrompt
                      id={missing.id}
                      title={`Archive ${missing.name}`}
                      hint="They come off the website, the police portal and the app straight away. Restoring from the Archive page brings them back unchanged."
                      busy={busy}
                      onConfirm={(remarks) => archivePost(missing.id, remarks)}
                      onCancel={() => setArchivingId(null)}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center gap-3">
                    <button
                      className={`${BUTTON} my-4`}
                      onClick={() => setEditingPerson({ ...missing })}
                      disabled={busy}
                    >
                      Edit
                    </button>
                    <button
                      className={`${BUTTON} my-4`}
                      onClick={() => setArchivingId(missing.id)}
                      disabled={busy}
                    >
                      Archive
                    </button>
                    <button
                      className={`${BUTTON} my-4`}
                      onClick={() => deleteMissingPost(missing.id, missing.image, missing.name)}
                      disabled={busy}
                    >
                      Delete
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
