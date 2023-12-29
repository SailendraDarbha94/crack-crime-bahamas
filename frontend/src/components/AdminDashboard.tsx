"use client";

import { db } from "@/db";
//import { supabase } from "@/lib/utils";
import { useEffect, useState } from "react";

enum JobType {
  FullTime = "FULL_TIME",
  PartTime = "PART_TIME"
}

const AdminDashboard = () => {
  const [location, setLocation] = useState<string>("");
  const [salary, setSalary] = useState<number>(0);
  const [type, setType] = useState<JobType>(JobType.FullTime);
  const [success, setSuccess] = useState<boolean>(false);
  const [qualification, setQualification] = useState<string>("");
  const [timings, setTimings] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [disabler, setDisabler] = useState<boolean>(true);
  const validator = async () => {
    if (location && salary && qualification && timings && title) {
      setDisabler(true);
    } else {
      setDisabler(false);
    }
  };

  useEffect(() => {
    validator();
  }, [location, salary, type, qualification, timings, title]);
  const [loading, setLoading] = useState<boolean>(false);
  

  const createNewJob = async () => {
    setLoading(true)
    const res = await fetch('/api/post', {
        method: 'POST',
        body: JSON.stringify({
            title : title,
            location : location,
            salary : salary,
            type : type,
            qualification : qualification,
            timings : timings
        })
    })
    console.log(res)
    if (res.status == 200) {
        alert('Job created successfully')
        setSuccess(true)
        setTitle("")
        setLocation("")
        setSalary(0)
        setType(JobType.PartTime)
        setTimings("")
        setQualification("")
        setLoading(false)
    }
  }

//   const createNewJob = async () => {
//     setLoading(true)
//     const res = await db.jobPosting.create({
//       data: {
//         title,
//         timings,
//         type,
//         qualification,
//         location,
//         salary
//       }
//     })
//     console.log(res)
//     if (res) {
//       setLoading(false)
//       setSuccess(true)
//     }
//   }

  // const createJob = async () => {
  //   setLoading(true);
  //   const { data, error } = await supabase
  //     .from("jobs")
  //     .insert([{ location, salary, type, qualification, timings, title }])
  //     .select();
  //   if (error) {
  //     setLoading(false);
  //     console.log(error);
  //     //throw new Error(error.message);
  //   } else {
  //     setLoading(false);
  //     setLocation("");
  //     setSalary("");
  //     setType("");
  //     setQualification("");
  //     setTimings("");
  //     setTitle("");
  //     console.log(data);
  //   }
  // };

  return (
    <div className="p-4">
      <style jsx>{`
        .label {
          text-align: right;
          width: 29%;
        }
        .inp {
          width: 69%;
          border-radius: 2px;
          color: black;
        }
        .holder {
          display: flex;
          justify-content: space-between;
          margin: 2px;
          padding: 2px;
        }
      `}</style>
      <h2 className="text-3xl text-center m-2 pb-4">Admin Panel</h2>
      <div className="flex flex-col max-w-md bg-yellow-700 rounded-lg p-2 m-2 mx-auto">
        <p className="text-center text-xl m-2 underline text-black">
          Create Job Posting
        </p>
        <div className="holder">
          <label className="label" htmlFor="title">
            Title
          </label>
          <input
            type="text"
            className="inp"
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="holder">
          <label className="label" htmlFor="location">
            Location
          </label>
          <input
            type="text"
            className="inp"
            id="location"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="holder">
          <label className="label" htmlFor="type">
            Type
          </label>
          <select className="text-black">
            <option value="FULL_TIME">---</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
          </select>
          {/* <input
            type="text"
            className="inp"
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          /> */}
        </div>
        <div className="holder">
          <label className="label" htmlFor="salary">
            Salary
          </label>
          <input
            type="text"
            className="inp"
            id="salary"
            name="salary"
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
          />
        </div>
        <div className="holder">
          <label className="label" htmlFor="qualification">
            Qualification
          </label>
          <input
            type="text"
            className="inp"
            id="qualification"
            name="qualification"
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
          />
        </div>
        <div className="holder">
          <label className="label" htmlFor="timings">
            Timings
          </label>
          <input
            type="text"
            className="inp"
            id="timings"
            name="timings"
            value={timings}
            onChange={(e) => setTimings(e.target.value)}
          />
        </div>
        {disabler ? (
          <button
            onClick={createNewJob}
            className="bg-yellow-300 text-black rounded-lg shadow-xl p-2 mt-4 hover:bg-black hover:text-white w-40 mx-auto"
          >
            {loading ? "Loading..." : "Create"}
          </button>
        ) : (
          <pre className="mx-auto my-2 p-2">Please fill in the form</pre>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
