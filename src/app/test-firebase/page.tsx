"use client";
import { useState } from "react";
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";

export default function SimpleFirebaseTest() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testBasicConnection = async () => {
    setLoading(true);
    setResult("");
    
    try {
      console.log("🔍 Testing basic Firebase connection...");
      console.log("📊 Database URL:", process.env.NEXT_PUBLIC_DATABASE_URL);
      console.log("🔑 Project ID:", process.env.NEXT_PUBLIC_PROJECT_ID);
      
      // Test 1: Try to read from root
      setResult(prev => prev + "Test 1: Reading from root path...\n");
      const rootRef = ref(database, "/");
      const rootSnapshot = await get(rootRef);
      setResult(prev => prev + `✅ Root read successful, exists: ${rootSnapshot.exists()}\n\n`);
      
      // Test 2: Try to read from missings
      setResult(prev => prev + "Test 2: Reading from 'missings' path...\n");
      const missingsRef = ref(database, "missings");
      const missingsSnapshot = await get(missingsRef);
      setResult(prev => prev + `✅ Missings read successful, exists: ${missingsSnapshot.exists()}\n`);
      if (missingsSnapshot.exists()) {
        const data = missingsSnapshot.val();
        setResult(prev => prev + `📊 Missings data: ${JSON.stringify(data, null, 2)}\n\n`);
      }
      
      // Test 3: Try to read from adverts
      setResult(prev => prev + "Test 3: Reading from 'adverts' path...\n");
      const advertsRef = ref(database, "adverts");
      const advertsSnapshot = await get(advertsRef);
      setResult(prev => prev + `✅ Adverts read successful, exists: ${advertsSnapshot.exists()}\n`);
      if (advertsSnapshot.exists()) {
        const data = advertsSnapshot.val();
        setResult(prev => prev + `📊 Adverts data: ${JSON.stringify(data, null, 2)}\n\n`);
      }
      
      setResult(prev => prev + "🎉 All tests completed successfully!\n");
      
    } catch (error) {
      console.error("❌ Firebase test failed:", error);
      setResult(prev => prev + `❌ Error: ${error}\n`);
      setResult(prev => prev + `Error details: ${JSON.stringify(error, null, 2)}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Simple Firebase Connection Test</h1>
      
      <button
        onClick={testBasicConnection}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400 mb-4"
      >
        {loading ? "Testing..." : "Test Firebase Connection"}
      </button>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
        <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
          {result || "Click the button to run the test..."}
        </pre>
      </div>
    </div>
  );
}
