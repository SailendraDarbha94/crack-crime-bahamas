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
import PostJob from "./PostJob";
import { supabase } from "@/lib/supabase";

const ClinicDashboard = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<any>();
  const [clinics, setClinics] = useState<any>();
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      //console.log(user)
      if (user) {
        setUserId(user.id);
        fetchUserClinics(user.id)
      } else {
        setUserId(null);
      }
    }
    getUser();
  }, []);
  const fetchUserClinics = async (params:string) => {
    let { data: clinics, error } = await supabase
      .from("clinics")
      .select("*")
      .eq("user_id", params);
    console.log(clinics);
    if (error) {
      console.error(error);
    }
    if (clinics) {
      setClinics(clinics);
    }
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
        {/* Job userId={userId} clinics={clinics} /> */}
      </div>
      <div className="hidden md:block w-full md:w-[48%] mx-auto p-4 bg-slate-300 shadow-lg rounded-lg">
        More Content Coming Soon
      </div>
    </div>
  );
};

export default ClinicDashboard;
