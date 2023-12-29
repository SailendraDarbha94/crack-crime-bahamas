"use client";

import { useState } from "react";
import { JobPosting } from "../constants";

const PostingCard = (job: JobPosting) => {
  const [apply, setApply] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [mail, setMail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  return (
    <>
      <div className="bg-white text-black my-2 rounded-lg p-2 lg:mx-40">
        <h2 className="text-center text-3xl underline mb-2 font-bold">
          {job.title}
        </h2>
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
          <button className="bg-blue-700 mx-auto p-2 rounded-md text-white" onClick={() => {
            setApply(!apply)
          }}>
            {apply ? "Close" : "Apply"}
          </button>
          {apply ? (
            <div className="p-4 mx-auto">
              <div className="holder">
                <label className="label" htmlFor="salary">
                  Name
                </label>
                <input
                  type="text"
                  className="rounded-md border-2 border-black"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="holder">
                <label className="label" htmlFor="salary">
                  Email
                </label>
                <input
                  type="email"
                  className="rounded-md border-2 border-black"
                  id="email"
                  name="email"
                  value={mail}
                  onChange={(e) => setMail(e.target.value)}
                />
              </div>
              <div className="holder">
                <label className="label" htmlFor="salary">
                  Phone
                </label>
                <input
                  type="text"
                  className="rounded-md border-2 border-black"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default PostingCard;
