"use client";
import React, { useState, useEffect } from "react";
import GoogleMap from "@/components/GoogleMap";
import { Button, Input, Textarea } from "@nextui-org/react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Coordinates } from "@/constants/interfaces";

export default function Page() {
  const [name, setName] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [timings, setTimings] = useState<string>("");
  const [regNo, setRegNo] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [specialities, setSpecialities] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false)
  const [coords, setCoords] = useState<Coordinates>({
    lat: 0,
    lng: 0
  })
  const router = useRouter();
  useEffect(() => {
    async function userIsThere() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
      }
    }
    userIsThere();
  }, []);

  const handleAddressChange = (newAddress: any) => {
    console.log(newAddress)
    setAddress(newAddress.address);
    setCoords(newAddress.coords)
  };
  async function handleSubmit() {
    setLoading(true)
    const obj = {
      name: name,
      description: desc,
      timings: timings,
      reg_num: regNo,
      coordinates: coords,
      specialties: specialities,
      address: address
    };

    const { data, error } = await supabase
      .from("clinics")
      .insert([{...obj}])
      .select();

    if(error){
      setLoading(false)
      console.log(error)
      return
    }

    if(!error && data){
      setLoading(false)
      router.push('/clinics')
    }
    setLoading(false)
  }

  return (
    <main className="flex flex-wrap flex-col md:flex-row min-h-screen items-start justify-center p-4 bg-transparent w-[99%] mx-auto shadow-lg rounded-lg">
      <div className="flex flex-col w-full justify-center items-center md:w-[40%] mx-auto rounded-lg shadow-lg shadow-slate-300 p-4">
        <Input
          className="max-w-80 my-2"
          name="name"
          value={name}
          type="text"
          label="Name"
          placeholder=""
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          className="max-w-80 my-2"
          name="timings"
          value={timings}
          type="text"
          label="Timings"
          placeholder="09:00AM - 02:00PM,03:30PM - 07:30PM etc"
          onChange={(e) => setTimings(e.target.value)}
        />
        <Input
          className="max-w-80 my-2"
          name="registration_number"
          value={regNo}
          type="text"
          label="Registration Number"
          placeholder=""
          onChange={(e) => setRegNo(e.target.value)}
        />
        <Input
          className="max-w-80 my-2"
          name="specialities"
          value={specialities}
          type="text"
          label="Specialities"
          placeholder=""
          onChange={(e) => setSpecialities(e.target.value)}
        />
        <Textarea
          label="Description"
          onChange={(e) => setDesc(e.target.value)}
          value={desc}
          placeholder="Enter a short description of your clinic"
          className="max-w-90 my-2"
        />
        <Input
          disabled
          className="w-full my-2"
          name="address"
          value={address}
          type="text"
          label="Address"
          placeholder="Provided by Google"
          //onChange={(e) => setRegNo(e.target.value)}
        />
      </div>
      <div className="w-full md:w-1/2 text-center">
        <GoogleMap onAddressSelect={handleAddressChange} />
      </div>
      <div className="flex w-full justify-center items-center p-2">
        <Button color="secondary" variant="flat" onPress={handleSubmit} isDisabled={loading}>
          {loading ? "Loading":"Submit"}
        </Button>
      </div>
    </main>
  );
}
