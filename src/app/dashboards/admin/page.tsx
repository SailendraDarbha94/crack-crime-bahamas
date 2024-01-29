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
import AdminDashboard from "@/components/AdminDashboard";
import ApiTester from "@/components/ApiTester";
import ClinicsList from "@/components/ClinicsList";

export default function Page() {

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
