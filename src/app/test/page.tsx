"use client";
import React, { useEffect, useState } from "react";
import { Button, Select, SelectItem } from "@nextui-org/react";
import { animals } from "../../constants/data";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function Page() {
  const getClinics = async () => {
    const res:any = await fetch("https://ayuryoj-backend.pankh.ai/clinic/list_clinics/", {
      method: "GET",
      headers: {
        //accept: "application/json",
        authorization: `Bearer ${token}`,
        //"Content-Type": "Application/json",
      },
    });
    const data = await res.json()
    console.log(data)


  };
  const createUserProfile = async () => {
    const userProfile = {
      "qualifications": "BDS",
      "experience": 2,
      "specializations": "BDS",
      "contact_phone": "9731339077",
      "contact_email": "darbhasailu@gmail.com",
      "address_line1": "A232, Sona Vistaas",
      "address_line2": "7th cross, Nyanappahalli main road",
      "city": "Bengaluru",
      "district": "Bengaluru",
      "state": "Karnataka",
      "country": "India",
      "postal_code": "560076",
      "additional_info": "Testing User Profile Api",
      "user_id": "4ce0bbfd-3f4d-4c0d-87d7-c7e742e5be12"
    }
    const res = await fetch('https://ayuryoj-backend.pankh.ai/users/user-profiles/',{
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
        authorization: `Bearer ${token}`,
      },
      mode: "cors",
      body: JSON.stringify({...userProfile})
    })
    console.log(res)
    const data = await res.json()
    console.log(data)
  }
  const [token, setToken] = useState<any>(null);
  useEffect(() => {
    const getSession = async () => {
      const res = await supabase.auth.getSession();
      const sess = await res.data.session;
      if (sess) {
        setToken(sess?.access_token);
      }
      //console.log(sess?.user.id);
    };
    
    getSession();
  }, []);


  return (
    <div className="flex w-full min-h-screen flex-wrap gap-4">
      <div>
        hello try clinics
        <Button color="secondary" variant="flat" onPress={getClinics}>
          test api
        </Button>
      </div>
      {/* <Select label="Select an animal" className="max-w-xs">
        {animals.map((animal) => (
          <SelectItem key={animal.value} value={animal.value}>
            {animal.label}
          </SelectItem>
        ))}
      </Select>
      <Select
        label="Favorite Animal"
        placeholder="Select an animal"
        className="max-w-xs"
      >
        {animals.map((animal) => (
          <SelectItem key={animal.value} value={animal.value}>
            {animal.label}
          </SelectItem>
        ))}
      </Select> */}
    </div>
  );
}
