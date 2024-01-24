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
  const [loading, setLoading] = useState<boolean>(false)

  return (
    <div className="flex w-full flex-wrap justify-center">
      <h1 className="text-center m-2 w-full text-2xl font-bold">
        Clinic Dashboard
      </h1>
      <div className="w-full md:w-[48%] mx-auto p-4 h-80 bg-slate-300 shadow-lg rounded-lg">
        <p className="flex w-full h-12 justify-center items-center text-lg font-semibold">
          Post a Job
        </p>
        <Divider />
        <div className="flex flex-col w-full h-full justify-start p-2 items-center">
          <Input
            className="w-80 my-2"
            name="email"
            //value={email}
            type="email"
            label="Email"
            placeholder=""
            //onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            className="w-80 my-2"
            name="password"
            //value={password}
            type="password"
            label="Password"
            placeholder=""
            //onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            color="primary"
            onPress={() => console.log("clicked submit")}
            variant="flat"
            className="mx-auto my-auto"
          >
            Submit
          </Button>
        </div>
      </div>
      <div className="w-full md:w-[48%] mx-auto p-4 bg-slate-300 shadow-lg rounded-lg">
        Tarara
      </div>

    </div>
  );
};

export default ClinicDashboard;
