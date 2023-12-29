"use client";

import { JobPosting } from "../constants"

const PostingCard = (job: JobPosting) => {
  return (
    <>
      <div className="bg-white text-black my-2 rounded-lg p-2 lg:mx-40">
        <h2 className="text-center text-3xl underline mb-2 font-bold">{job.title}</h2>
        <div className="flex flex-col">
          <div className="flex justify-evenly text-lg font-semibold">
            <div>Location : {job.location}</div>
            <div>Type : {job.type}</div>
          </div>
          <div className="flex justify-center text-lg font-semibold">
            
            <div>Qualification : {job.qualification}</div>
            {/* <div>Required for : {job.duration}</div> */}
          </div>
          <div className="flex justify-evenly text-lg font-semibold">
            <div>Timings : {job.timings}</div>
            <div>Salary : {job.salary} Rs</div>
          </div>
          <button className="bg-blue-700 mx-auto p-2 rounded-md text-white">
            Apply
          </button>
        </div>
      </div>
    </>
  );
};

export default PostingCard;
