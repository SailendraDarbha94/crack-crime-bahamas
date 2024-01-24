"use client";
import ClinicDashboard from "@/components/ClinicDashboard";
import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";

const Page = () => {
  const [clinics, setClinics] = useState<any>(null);
  useEffect(() => {
    async function getData() {
      let { data: clinics, error } = await supabase.from("clinics").select("*");
      if (error) {
        console.log(error);
      }
      if (clinics) {
        console.log(clinics);
        setClinics(clinics);
      }
    }
    getData();
  }, []);
  return <ClinicDashboard />;
};

export default Page;
