import React, { useState } from "react";

const JobForm = () => {
  const [job, setJob] = useState({
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJob((prevValue) => {
      return {
        ...prevValue,
        [name]: value,
      };
    });
  };

  const handleClick = (e) => {
    e.preventDefault();
    console.log(job);
  };

  return (
    <div>
      <div className="my-[5%] mx-[25%]">
        <p>Post a new Job</p>
        <form>
          <div className="flex">
            <p>Clinic ID:</p>
            <input
              name="clinic_id"
              onChange={handleChange}
              value={job.clinic_id}
              placeholder="Enter Clinic ID"
            />
          </div>
          <div className="flex">
            <p>Type of Organization:</p>
            <input
              name="organization_type"
              onChange={handleChange}
              value={job.organization_type}
              placeholder="Enter the type of organization"
            />
          </div>
          <div className="flex">
            <p>Job Function:</p>
            <input
              name="job_function"
              onChange={handleChange}
              value={job.job_function}
              placeholder="Enter function of job"
            />
          </div>
          <div className="flex">
            <p>Location:</p>
            <input
              name="work_location"
              onChange={handleChange}
              value={job.work_location}
              placeholder="Enter work location"
            />
          </div>
          <div className="flex">
            <p>Vacancies:</p>
            <input
              name="vacancies"
              onChange={handleChange}
              value={job.vacancies}
              placeholder="Enter no of vacancies"
            />
          </div>
          <div className="flex">
            <p>Shift Timings:</p>
            <input
              name="shift"
              onChange={handleChange}
              value={job.shift}
              placeholder="Enter shift timings"
            />
          </div>
          <div className="flex">
            <p>Salary Range:</p>
            <input
              name="salary_range"
              onChange={handleChange}
              value={job.salary_range}
              placeholder="Enter salary range"
            />
          </div>
          <div className="flex">
            <p>Job Description:</p>
            <input
              name="job_description"
              onChange={handleChange}
              value={job. job_description}
              placeholder="Enter the job description"
            />
          </div>
          <div className="flex">
            <p>Qualifications Required:</p>
            <input
              name="qualification"
              onChange={handleChange}
              value={job.qualification}
              placeholder="Enter qualifications required"
            />
          </div>
          <div className="flex">
            <p>Experience Required:</p>
            <input
              name="experience_required"
              onChange={handleChange}
              value={job.experience_required}
              placeholder="Enter duration of experience"
            />
          </div>
          <div className="flex">
            <p>Key Skills Required:</p>
            <input
              name="key_skills"
              onChange={handleChange}
              value={job.key_skills}
              placeholder="Enter skills required"
            />
          </div>
          <button onClick={handleClick}>POST</button>
        </form>
      </div>
    </div>
  );
};

export default JobForm;
