"use client";

import { Post } from "@/constants/posts";

const PostingCard = (job: Post) => {
  return (
    <>
      <style jsx>
        {`
          .card {
            margin: 0.5rem;
            padding: 0.5rem;
            background-color: #60a5fa; /* Tailwind bg-blue-500 */
            border-radius: 0.375rem; /* rounded-md */
            width: 100%; /* min-w-full */
          }
          .header {
            text-align: center;
          }
          .infoSection {
            background-color: #bfdbfe; /* Tailwind bg-blue-300 */
            border-radius: 0.5rem; /* rounded-lg */
          }
          .infoRow {
            display: flex;
            justify-content: space-around;
            padding: 0.5rem;
            color: black;
          }
          .yellowBackground {
            background-color: #facc15; /* Tailwind bg-yellow-400 */
          }
          .redBackground {
            background-color: #fecaca; /* Tailwind bg-red-200 */
          }
        `}
      </style>
      <div className="card">
        <h2 className="header">{job.title}</h2>
        <div className="infoSection">
          <div className={`infoRow yellowBackground`}>
            <div>Location : {job.location}</div>
            <div>Type : {job.type}</div>
          </div>
          <div className={`infoRow redBackground`}>
            
            <div>Qualification : {job.qualification}</div>
            {/* <div>Required for : {job.duration}</div> */}
          </div>
          <div className={`infoRow redBackground`}>
            <div>Timings : {job.timings}</div>
            <div>Salary : {job.salary}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostingCard;
