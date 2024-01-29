"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Divider,
  Input,
  Select,
  SelectItem,
  Tab,
  Tabs,
} from "@nextui-org/react";
//import { animals } from "../../constants/data";
//import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
//import PostJob from "@/components/PostJob";
import { httpReq } from "@/lib/http";
import AdminDashboard from "@/components/AdminDashboard";
import ApiTester from "@/components/ApiTester";
import ClinicsList from "@/components/ClinicsList";

export default function Page() {
  // const getClinics = async () => {
  //   const res:any = await fetch("https://ayuryoj-backend.pankh.ai/clinic/list_clinics/", {
  //     method: "GET",
  //     headers: {
  //       //accept: "application/json",
  //       authorization: `Bearer ${token}`,
  //       //"Content-Type": "Application/json",
  //     },
  //   });
  //   const data = await res.json()
  //   console.log(data)

  // };
  // const createUserProfile = async () => {
  //   const userProfile = {
  //     "qualifications": "BDS",
  //     "experience": 2,
  //     "specializations": "BDS",
  //     "contact_phone": "9731339077",
  //     "contact_email": "darbhasailu@gmail.com",
  //     "address_line1": "A232, Sona Vistaas",
  //     "address_line2": "7th cross, Nyanappahalli main road",
  //     "city": "Bengaluru",
  //     "district": "Bengaluru",
  //     "state": "Karnataka",
  //     "country": "India",
  //     "postal_code": "560076",
  //     "additional_info": "Testing User Profile Api",
  //     "user_id": "4ce0bbfd-3f4d-4c0d-87d7-c7e742e5be12"
  //   }
  //   const res = await fetch('https://ayuryoj-backend.pankh.ai/users/user-profiles/',{
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "Application/json",
  //       authorization: `Bearer ${token}`,
  //     },
  //     mode: "cors",
  //     body: JSON.stringify({...userProfile})
  //   })
  //   console.log(res)
  //   const data = await res.json()
  //   console.log(data)
  // }
  //const [token, setToken] = useState<any>(null);
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
        fetchUserClinics(user.id);
      } else {
        setUserId(null);
      }
    }
    getUser();
  }, []);
  const fetchUserClinics = async (params: string) => {
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
    <div className="w-full min-h-screen">
      {/* <div>
        hello try clinics
        <Button color="secondary" variant="flat" onPress={httpReqMaker}>
          test api
        </Button>
      </div> */}
      <h1 className="text-center w-full text-2xl font-bold my-2 p-2 max-h-fit">
        Admin Dashboard
      </h1>
      <Divider />
      {/* <PostJob userId={userId} clinics={clinics} /> */}
      <div className="w-full h-full text-center m-0 p-0">
        <Tabs aria-label="Options" className="mt-3">
          <Tab key="users" title="Users" className="w-full text-center">
            <AdminDashboard />
          </Tab>
          <Tab key="clinics" title="Clinics">
            <ClinicsList />
          </Tab>
          <Tab key="api" title="API">
            <ApiTester />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
