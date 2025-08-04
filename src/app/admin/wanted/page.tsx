"use client";

import { WantedPersonService, DatabaseService } from "@/lib/firebaseService";
import { FirebaseErrorHandler } from "@/lib/firebaseErrorHandler";
import { useToast } from "@/lib/toastContext";
import { useEffect, useState } from "react";
import AddWanted from "./AddWanted";
import MissingListItem from "../missing/MissingListItem";

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
  const [addWanted, setAddWanted] = useState<boolean>(false);
  const [wanteds, setWanteds] = useState<WantedPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
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
      console.log('✅ Successfully fetched wanted persons:', wantedPersons);
      toast({ message: "Wanted Persons List Fetched", type: "info" });
      setWanteds(wantedPersons);
    } catch (err) {
      const errorMessage = FirebaseErrorHandler.handleError(err);
      setError(errorMessage);
      console.error("❌ Error fetching wanted persons:", err);
      
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

  const deleteWantedPost = async (id: string, imagePath: string) => {
    if (!confirm("Are you sure you want to delete this wanted person report?")) {
      return;
    }

    try {
      await WantedPersonService.deleteWantedPerson(id, imagePath);
      console.log("Post deleted successfully");
      
      // Refresh the list
      await fetchWantedPersons();
      
      toast({ message: "Wanted person report deleted successfully", type: "success" });
    } catch (err) {
      const errorMessage = FirebaseErrorHandler.handleError(err);
      toast({ message: `Could not delete: ${errorMessage}`, type: "error" });
      console.error("Could not delete:", err);
    }
  };

  useEffect(() => {
    fetchWantedPersons();
  }, []);

  // Refresh data when the add form is closed (in case new data was added)
  useEffect(() => {
    if (!addWanted && showWanted) {
      fetchWantedPersons();
    }
  }, [addWanted, showWanted]);

  return (
    <main className="font-nunito py-3">
      <h1 className="text-3xl border-b-2 border-black">Wanted Persons</h1>
      <div className="flex p-2 mb-4 justify-around">
        <button
          className="bg-purple-200 dark:bg-slate-500 p-2 rounded-lg"
          onClick={() => setShowWanted(!showWanted)}
        >
          {showWanted ? "Hide Wanted Persons" : "Show Wanted Persons"}
        </button>
        <button
          className="bg-purple-200 dark:bg-slate-500 p-2 rounded-lg"
          onClick={() => setAddWanted(!addWanted)}
        >
          {addWanted ? "Hide Wanted Form" : "Add Wanted Person"}
        </button>
      </div>
      {addWanted && <AddWanted onSuccess={() => fetchWantedPersons()} />}
      
      {showWanted && (
        <div className="w-full">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-4">
              Error: {error}
              <button 
                onClick={fetchWantedPersons}
                className="block mx-auto mt-2 bg-blue-500 text-white px-4 py-2 rounded"
              >
                Retry
              </button>
            </div>
          ) : wanteds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No wanted persons reported
            </div>
          ) : (
            wanteds.map((wanted) => (
              <div
                key={wanted.id}
                className="border-2 border-black rounded-lg py-2 px-4 my-2"
              >
                <MissingListItem 
                  name={wanted.name}
                  age={typeof wanted.age === 'string' ? parseInt(wanted.age) || 0 : wanted.age}
                  gender={wanted.gender}
                  id={wanted.id}
                  alias={wanted.alias}
                  image={wanted.image}
                />
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <h4 className="font-semibold text-red-600">Wanted For:</h4>
                  <p className="text-sm">{wanted.wanted_for}</p>
                  {wanted.description && (
                    <>
                      <h4 className="font-semibold mt-2">Description:</h4>
                      <p className="text-sm">{wanted.description}</p>
                    </>
                  )}
                  {wanted.last_known_address && (
                    <>
                      <h4 className="font-semibold mt-2">Last Known Address:</h4>
                      <p className="text-sm">{wanted.last_known_address}</p>
                    </>
                  )}
                </div>
                <div className="flex justify-center">
                  <button
                    className="bg-red-300 hover:bg-red-400 p-2 rounded-md transition-colors"
                    onClick={() => deleteWantedPost(wanted.id, wanted.image)}
                  >
                    Delete
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
