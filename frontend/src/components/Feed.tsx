"use client";

import { JobPosting } from "@/constants";
import { useEffect, useState } from "react";
import PostingCard from "./PostingCard";

const Feed = (jobs: any) => {
  // useEffect(() => {
  //     setPosts(jobs)
  // },[jobs])
  // const [posts, setPosts] = useState<any>()
  const jobPosts: JobPosting[] = jobs.jobs;
  //const jobsArray = jobs as Array<any>;

  return (
    <div className="p-4">
      {jobPosts.map((job: any) => {
        return (
          <PostingCard {...job} key={job.id} />
        );
      })}
    </div>
  );
};

export default Feed;
