"use client";
import { useState } from "react";
import { DatabaseService, StorageService } from "@/lib/firebaseService";

export default function FirebaseDebugger() {
  const [results, setResults] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testDatabaseConnection = async () => {
    setLoading(true);
    setResults("Testing database connection...\n");
    
    try {
      // Test basic database connection
      const isConnected = await DatabaseService.testConnection();
      setResults(prev => prev + `📡 Database connection: ${isConnected ? '✅ Connected' : '❌ Disconnected'}\n\n`);
      
      if (!isConnected) {
        setResults(prev => prev + "❌ Cannot proceed - database not connected\n");
        setLoading(false);
        return;
      }
      
      // Test reading from missings path
      setResults(prev => prev + "🔍 Testing read access to 'missings' path...\n");
      const testData = await DatabaseService.getAll("missings");
      setResults(prev => prev + `✅ Successfully read from 'missings': ${testData.length} records found\n\n`);
      
      // Test reading from missing path (singular)
      setResults(prev => prev + "🔍 Testing read access to 'missing' path...\n");
      const testData2 = await DatabaseService.getAll("missing");
      setResults(prev => prev + `✅ Successfully read from 'missing': ${testData2.length} records found\n\n`);
      
      // Test each advert group
      const groups = ["home", "emergency", "whoWeAre", "police", "supportAndSafety", "fullpageHome", "fullpageSecond"];
      
      for (const group of groups) {
        try {
          const data = await DatabaseService.get(`adverts/${group}`);
          if (data) {
            setResults(prev => prev + `📁 ${group}: Has data\n`);
            setResults(prev => prev + `   Path: ${data.path}\n`);
            
            // Try to check if file exists in storage
            try {
              const url = await StorageService.getDownloadURL(data.path);
              setResults(prev => prev + `   ✅ File exists in storage\n`);
              setResults(prev => prev + `   🔗 URL: ${url}\n`);
            } catch (error) {
              setResults(prev => prev + `   ❌ File NOT found in storage\n`);
              setResults(prev => prev + `   Error: ${error}\n`);
            }
          } else {
            setResults(prev => prev + `📁 ${group}: No data\n`);
          }
        } catch (error) {
          setResults(prev => prev + `❌ ${group}: Error - ${error}\n`);
        }
        setResults(prev => prev + "\n");
      }
      
    } catch (error) {
      setResults(prev => prev + `❌ Database connection/test failed: ${error}\n`);
      setResults(prev => prev + `Error details: ${JSON.stringify(error, null, 2)}\n`);
    }
    
    setLoading(false);
  };

  const clearInvalidEntries = async () => {
    setLoading(true);
    setResults("Clearing invalid entries...\n");
    
    try {
      const groups = ["home", "emergency", "whoWeAre", "police", "supportAndSafety", "fullpageHome", "fullpageSecond"];
      
      for (const group of groups) {
        try {
          const data = await DatabaseService.get(`adverts/${group}`);
          if (data?.path) {
            try {
              await StorageService.getDownloadURL(data.path);
              setResults(prev => prev + `✅ ${group}: File exists, keeping entry\n`);
            } catch (error) {
              setResults(prev => prev + `🗑️ ${group}: Removing invalid entry\n`);
              await DatabaseService.delete(`adverts/${group}`);
            }
          }
        } catch (error) {
          setResults(prev => prev + `❌ ${group}: Error checking - ${error}\n`);
        }
      }
      
      setResults(prev => prev + "\n✅ Cleanup complete!\n");
    } catch (error) {
      setResults(prev => prev + `❌ Cleanup failed: ${error}\n`);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firebase Debugger</h1>
      
      <div className="space-x-4 mb-6">
        <button
          onClick={testDatabaseConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Test Database & Storage
        </button>
        
        <button
          onClick={clearInvalidEntries}
          disabled={loading}
          className="bg-red-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Clear Invalid Entries
        </button>
      </div>
      
      {loading && (
        <div className="mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Results:</h2>
        <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
          {results || "Click a button to run tests..."}
        </pre>
      </div>
    </div>
  );
}
