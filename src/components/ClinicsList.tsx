"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@nextui-org/react";

const ClinicsList = ({ clinicsData }: any) => {

  const columns = [
    // {
    //     key: "clinic_id",
    //     label: "Id"
    // },
    {
      key: "name",
      label: "Name",
    },
    {
      key: "reg_num",
      label: "Reg. No.",
    },
    {
      key: "specialties",
      label: "Specialties",
    },
    {
      key: "timings",
      label: "Timings"
    },
    {
      key: "address",
      label: "Address",
    },
  ];
  return (
    <div className="w-[99%] mx-auto">
      <Table aria-label="Example table with dynamic content" shadow="lg" isStriped>
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn width={20} key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        {clinicsData ? (
          <TableBody items={clinicsData}>
            {(item: any) => (
              <TableRow key={item.clinic_id}>
                {(columnKey) => (
                  <TableCell>{getKeyValue(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        ) : (
          <TableBody emptyContent={"Loading Data..."}>{[]}</TableBody>
        )}
      </Table>
    </div>
  );
};
export default ClinicsList;
