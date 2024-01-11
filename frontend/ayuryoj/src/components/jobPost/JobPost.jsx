import React, { useEffect, useState } from "react";

const JobPost = (Props) => {
  const [jobDetails, setJobDetails] = useState({
    job_id: "",
    clinic_id: "",
    posted_date: "",
    organization_type: "",
    job_function: "",
    work_location: "",
    vacancies: "",
    shift: "",
    salary_range: "",
    job_description: "",
    qualification: "",
    experience_required: "",
    key_skills: "",
  });


  const handleClick = (e) => {
    e.preventDefault();
    console.log(job);
  };

  useEffect(() => {
    console.log(Props)
  }, [])

  return (
    <div>
      <div className="min-w-fit bg-red-300 m-2 p-2">
        <p>Job Post</p>
        {/* create remaining markup assuming job data fetched from backend */}
        <p>{Props.job_id}</p>
      </div>
    </div>
  );
};

export default JobPost;
