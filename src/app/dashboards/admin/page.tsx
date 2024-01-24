"use client";
import AdminDashboard from "@/components/AdminDashboard";
import React, { useEffect, useState } from "react";

const Page = () => {
  const [clinics, setClinics] = useState<any>(null);
  useEffect(() => {
    console.log("Admin Dashboard")
  }, []);
  return <AdminDashboard />;
};

export default Page;
