"use client";

import { dateReader } from "@/lib/utils";
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
      {/* <div>
        {memberIndex &&
          memberIndex.map((index) => {
            return (
              <div
                key={index}
                className="my-2 rounded-lg border-2 border-slate-600 p-2"
              >
                <p className="my-1 text-lg font-semibold">
                  Name : {members[index].name}
                </p>
                <p className="my-1 text-lg font-semibold">
                  Email : {members[index].email}
                </p>
                <p className="my-1 text-lg font-semibold">
                  Mobile : {members[index].mobile}
                </p>
                <p className="my-1 text-lg font-semibold">
                  Address : {members[index].address}
                </p>
                <p className="my-1 text-lg font-semibold">
                  Support Level : {members[index].support}
                </p>
                <p className="my-1 text-lg font-semibold">
                  Applied On : {dateReader(members[index].created_at)}
                </p>
              </div>
            );
          })}
      </div> */}
    </main>
  );
};

export default Page;
