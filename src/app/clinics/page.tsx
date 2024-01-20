"use client";
import ClinicsList from "@/components/ClinicsList";
import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";

const page = () => {
    const [clinics, setClinics] = useState<any>(null)
  useEffect(() => {
    async function getData() {
      let { data: clinics, error } = await supabase.from("clinics").select("*");
    if(error){
        console.log(error)
    }
    if(clinics){
        console.log(clinics)
        setClinics(clinics)
    }
    }
    getData()
  }, []);
  return <ClinicsList clinicsData={clinics} />;
};

export default page;
