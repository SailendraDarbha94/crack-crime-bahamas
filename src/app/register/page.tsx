"use client";
import React, { useState, useEffect } from "react";
import GoogleMap from "@/components/GoogleMap";
import { Button, Input } from "@nextui-org/react";

export default function page() {
  return (
    <main className="flex flex-wrap flex-col md:flex-row min-h-screen items-start justify-center p-4 bg-transparent w-[99%] mx-auto shadow-lg rounded-lg">
      <div className="w-full md:w-1/2">other fields</div>
      <div className="w-full md:w-1/2 text-center">
        <GoogleMap />
      </div>
    </main>
  );
}
