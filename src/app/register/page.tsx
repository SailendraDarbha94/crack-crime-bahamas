"use client";
import React, { useState, useEffect } from "react";
import GoogleMap from "@/components/GoogleMap";
import { Button, Input, Textarea } from "@nextui-org/react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Coordinates } from "@/constants/interfaces";
import Register from "./Register";

export default function Page() {
  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      console.log(user);
    }
  }

  useEffect(() => {
    getUser()
  },[])

  return (
    <div>
      <Register />
    </div>
  );
}
