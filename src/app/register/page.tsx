"use client";
import React, { useState, useEffect } from "react";
import GoogleMap from "@/components/GoogleMap";
import { Button, Input, Textarea } from "@nextui-org/react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Coordinates } from "@/constants/interfaces";
import Register from "./Register";

export default function Page() {
  const [user, setUser] = useState<any>()
  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUser(user)
    }
  }

  useEffect(() => {
    getUser()
  },[])

  return (
    <div>
      {user && <Register user={user} />}
    </div>
  );
}
