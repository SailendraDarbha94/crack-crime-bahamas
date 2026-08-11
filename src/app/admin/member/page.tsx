"use client";

import { useEffect, useState } from "react";

const Page = () => {
  const [members, setMembers] = useState<any | null>(null);
  const [memberIndex, setMemberIndices] = useState<any[] | null>(null);
  const getMembershipRequests = async () => {
    const res = await fetch("/api/member");
    const { data } = await res.json();
    if (data !== "request failure") {
      console.log(data);
      setMemberIndices(Object.keys(data));
      setMembers(data);
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
