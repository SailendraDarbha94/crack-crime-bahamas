import React, { useEffect, useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import JobPost from "../../components/jobPost/JobPost"
import { JOBS_DATA } from "./jobPost.data";

const JobPosting = () => {
    const [jobDetails, setJobDetails] = useState([]);

    useEffect(() => {
        setJobDetails(JOBS_DATA)
      },[])
  return (
    <>
      <Navbar />
        {jobDetails ? (
            jobDetails.map((job) => {
                return (
                    <JobPost {...job} />
                )
            })
        ) : null}
    </>
  );
};

export default JobPosting;
