"use client";
import ClinicsList from "@/components/ClinicsList";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Divider,
  Input,
  Link,
  Spinner,
} from "@nextui-org/react";
import { createClient } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";

const ClinicDashboard = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [job, setJob] = useState({
    qualification: "",
    shift: "",
    job_description: "",
    experience_required: "",
    key_skills: "",
    expected_salary: "",
    location: "",
  });

  const handleChange = (e: any) => {
    const { name, value }: any = e.target;
    setJob((prevValue) => {
      return {
        ...prevValue,
        [name]: value,
      };
    });
  };

  const handleClick = (e:any) => {
    //e.preventDefault();
    console.log(job);
  };

  return (
    <div className="flex w-full flex-wrap justify-center">
      <h1 className="text-center m-2 w-full text-2xl font-bold">
        Clinic Dashboard
      </h1>
      <div className="w-full md:w-[48%] mx-auto min-h-80 p-2 bg-slate-300 shadow-lg rounded-lg">
        <p className="flex w-full h-12 justify-center items-center text-lg font-semibold">
          Post a Job
        </p>
        <Divider />
        <div className="flex flex-col w-full h-full justify-start p-2 items-center">
          <Input
            className="min-w-80 my-2"
            name="job_description"
            value={job.job_description}
            type="text"
            label="Job Description"
            placeholder=""
            onChange={handleChange}
          />
          <Input
            className="min-w-80 my-2"
            name="shift"
            value={job.shift}
            type="text"
            label="Shift Timings"
            placeholder=""
            onChange={handleChange}
          />
          <Input
            className="min-w-80 my-2"
            name="qualification"
            value={job.qualification}
            type="text"
            label="Required Qualifications"
            placeholder=""
            onChange={handleChange}
          />
          <Input
            className="min-w-80 my-2"
            name="experience_required"
            value={job.experience_required}
            type="text"
            label="Required Experience"
            placeholder=""
            onChange={handleChange}
          />
          <Input
            className="min-w-80 my-2"
            name="key_skills"
            value={job.key_skills}
            type="text"
            label="Key Skills"
            placeholder=""
            onChange={handleChange}
          />
          <Input
            className="min-w-80 my-2"
            name="expected_salary"
            value={job.expected_salary}
            type="text"
            label="Expected Salary"
            placeholder=""
            onChange={handleChange}
          />
          <Button
            color="primary"
            onPress={handleClick}
            variant="flat"
            className="mx-auto"
          >
            Submit
          </Button>
        </div>
      </div>
      <div className="hidden md:block w-full md:w-[48%] mx-auto p-4 bg-slate-300 shadow-lg rounded-lg">
        Tarara
      </div>
    </div>
  );
};

export default ClinicDashboard;
