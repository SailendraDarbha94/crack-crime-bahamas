"use client";

import PostingCard from "@/components/PostingCard";
import { JOBS, Post } from "@/constants/posts";
import { supabase } from "@/lib/utils";
import { useEffect, useState } from "react";

const Page = () => {
  const [jobs, setJobs] = useState<Post[]>();
  useEffect(() => {
    async function fetchJobs() {
      let { data, error }: { data: Post[] | any; error: Error | any } =
        await supabase.from("jobs").select("*");
      if (error) {
        throw new Error("error fetching jobs");
      } else {
        setJobs(data);
        return jobs;
      }
    }
    fetchJobs();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-3xl text-center my -2 py-2">Job Listings</h1>
      <div className="flex flex-col items-center justify-around p-4">
        {jobs ? (
             jobs.map((job) => {
                return <PostingCard {...job} key={job.id} />;
              })
        ) : (
            <div>
                Loading Jobs
            </div>
        )}
      </div>
    </div>
  );
};

export default Page;
