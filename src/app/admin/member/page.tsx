"use client";

import { DatabaseService } from "@/lib/firebaseService";
import { useEffect, useState } from "react";

const Page = () => {
  const [members, setMembers] = useState<any[] | null>(null);

  // Reads /members directly as the signed-in admin — the unauthenticated
  // GET /api/member endpoint (a PII leak) was removed.
  const getMembershipRequests = async () => {
    try {
      const results = await DatabaseService.getAll("members");
      setMembers(results);
    } catch (err) {
      console.error("Could not fetch membership requests:", err);
      setMembers([]);
    }
  };

  useEffect(() => {
    getMembershipRequests();
  }, []);

  return (
    <main className="w-full min-h-screen font-nunito">
      <h2 className="text-3xl mt-10 p-2 underline font-bold">
        Membership Requests Management Coming Soon
      </h2>
    </main>
  );
};

export default Page;
