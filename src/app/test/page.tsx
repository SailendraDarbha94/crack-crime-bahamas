"use client"
import React from "react";
import { Select, SelectItem } from "@nextui-org/react";
import { animals } from "../../constants/data";
export default function Page() {
  return (
    <div className="flex w-full min-h-screen flex-wrap gap-4">
      <Select label="Select an animal" className="max-w-xs">
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
      </Select>
    </div>
  );
}
