"use client";

import { MissingPersonService, DatabaseService } from "@/lib/firebaseService";
import { FirebaseErrorHandler } from "@/lib/firebaseErrorHandler";
import { useToast } from "@/lib/toastContext";
import { useEffect, useState } from "react";
import AddMissing from "./AddMissing";
import MissingListItem from "./MissingListItem";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { Button } from "@nextui-org/react";

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
  const [addMissing, setAddMissing] = useState<boolean>(false);
  const [missings, setMissings] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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
      console.log('✅ Successfully fetched missing persons:', missingPersons);
      toast({ message: "Missing Persons List Fetched", type: "info" });
      setMissings(missingPersons);
    } catch (err) {
      const errorMessage = FirebaseErrorHandler.handleError(err);
      setError(errorMessage);
      console.error("❌ Error fetching missing persons:", err);
      
      // Additional debugging info
      if (err instanceof Error && err.message.includes('Permission denied')) {
        console.error('🔒 Permission denied error - check Firebase rules and authentication');
        console.error('🔗 Database URL:', process.env.NEXT_PUBLIC_DATABASE_URL);
        console.error('🔑 Project ID:', process.env.NEXT_PUBLIC_PROJECT_ID);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteMissingPost = async (id: string, imagePath: string) => {
    if (!confirm("Are you sure you want to delete this missing person report?")) {
      return;
    }

    try {
      await MissingPersonService.deleteMissingPerson(id, imagePath);
      console.log("Post deleted successfully");
      
      // Refresh the list
      await fetchMissingPersons();
      
      toast({ message: "Missing person report deleted successfully", type: "success" });
    } catch (err) {
      const errorMessage = FirebaseErrorHandler.handleError(err);
      toast({ message: `Could not delete: ${errorMessage}`, type: "error" });
      console.error("Could not delete:", err);
    }
  };

  useEffect(() => {
    fetchMissingPersons();
  }, []);

  // Refresh data when the add form is closed (in case new data was added)
  useEffect(() => {
    if (!addMissing && showMissing) {
      fetchMissingPersons();
    }
  }, [addMissing, showMissing]);

  return (
    <main className="font-nunito py-3 m-2 rounded-3xl">
      <h1 className="text-2xl font-bold rounded-3xl border-2 border-black py-2 text-center">Missing Persons</h1>
      <div className="flex p-2 mb-4 justify-around">
        <Button
          className="font-bold text-lg"
          variant="flat"
          color="primary"
          onClick={() => setShowMissing(!showMissing)}
        >
          {showMissing ? "Hide Missing Persons" : "Show Missing Persons"}
        </Button>
        <Button className="font-bold text-lg" variant="ghost" color="warning" onPress={() => {
          () => setAddMissing(!addMissing)
          onOpen();
        }}>
          Add Missing Person
        </Button>
      </div>
      
      <Modal className="max-h-full" isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalBody>
                <AddMissing onSuccess={() => fetchMissingPersons()} />
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
      
      {addMissing && <AddMissing onSuccess={() => fetchMissingPersons()} />}
      
      {showMissing && (
        <div className="w-full">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-4">
              Error: {error}
              <button 
                onClick={fetchMissingPersons}
                className="block mx-auto mt-2 bg-blue-500 text-white px-4 py-2 rounded"
              >
                Retry
              </button>
            </div>
          ) : missings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No missing persons reported
            </div>
          ) : (
            missings.map((missing) => (
              <div
                key={missing.id}
                className="bg-white text-black rounded-3xl py-2 px-4 my-2"
              >
                <MissingListItem 
                  name={missing.name}
                  age={missing.age}
                  gender={missing.gender}
                  id={missing.id}
                  alias={missing.alias}
                  image={missing.image}
                />
                {missing.description && (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <h4 className="font-semibold text-blue-600">Description:</h4>
                    <p className="text-sm">{missing.description}</p>
                    {missing.last_known_address && (
                      <>
                        <h4 className="font-semibold mt-2">Last Known Address:</h4>
                        <p className="text-sm">{missing.last_known_address}</p>
                      </>
                    )}
                  </div>
                )}
                <div className="flex justify-center">
                  <button
                    className="bg-red-600/90 my-4 font-bold backdrop-blur-sm hover:bg-red-500/90 text-white hover:border-red-300/50 relative px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ease-out transform active:scale-95"
                    onClick={() => deleteMissingPost(missing.id, missing.image)}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
};

export default Page;
