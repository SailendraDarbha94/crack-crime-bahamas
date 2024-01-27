//@ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Chip,
  Tooltip,
  getKeyValue,
} from "@nextui-org/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  Input,
} from "@nextui-org/react";
import { EditIcon } from "./EditIcon";
import { DeleteIcon } from "./DeleteIcon";
import { EyeIcon } from "./EyeIcon";
import { columns, users } from "./data";
import { supabase } from "@/lib/supabase";
const statusColorMap = {
  active: "success",
  paused: "danger",
  vacation: "warning",
};

export default function JobsList() {
  const [jobs, setJobs] = useState<any>(null);
  useEffect(() => {
    const fetchJobsList = async () => {
      let { data: jobs, error } = await supabase.from("jobs").select("*");

      if (error) {
        console.error(error);
      }
      if (jobs) {
        console.log(jobs);
        setJobs(jobs)
      }
    };
    fetchJobsList();
  }, []);
  // const renderCell = React.useCallback((user, columnKey) => {88
  //   const cellValue = user[columnKey];

  //   switch (columnKey) {
  //     case "name":
  //       return (
  //         <User
  //           avatarProps={{ radius: "lg", src: user.avatar }}
  //           description={user.email}
  //           name={cellValue}
  //         >
  //           {user.email}
  //         </User>
  //       );
  //     case "role":
  //       return (
  //         <div className="flex flex-col">
  //           <p className="text-bold text-sm capitalize">{cellValue}</p>
  //           <p className="text-bold text-sm capitalize text-default-400">
  //             {user.team}
  //           </p>
  //         </div>
  //       );
  //     case "status":
  //       return (
  //         <Chip
  //           className="capitalize"
  //           color={statusColorMap[user.status]}
  //           size="sm"
  //           variant="flat"
  //         >
  //           {cellValue}
  //         </Chip>
  //       );
  //     case "actions":
  //       return (
  //         <div className="relative flex items-center gap-2">
  //           <Tooltip content="Details">
  //             <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
  //               <EyeIcon />
  //             </span>
  //           </Tooltip>
  //           <Tooltip content="Apply For Job">
  //             <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
  //               <Button onPress={() => console.log("clicked")} color="primary" variant="shadow">
  //                 <EditIcon />
  //               </Button>
  //             </span>
  //           </Tooltip>
  //           {/* <Tooltip color="danger" content="Delete user">
  //             <span className="text-lg text-danger cursor-pointer active:opacity-50">
  //               <DeleteIcon />
  //             </span>
  //           </Tooltip> */}
  //         </div>
  //       );
  //     default:
  //       return cellValue;
  //   }
  // }, []);
  const columns = [
    {
      key: "created_at",
      label: "Posted At",
    },
    {
      key: "description",
      label: "Desc.",
    },
    {
      key: "experience",
      label: "Exp",
    },
    {
      key: "location",
      label: "Address",
    },
    {
      key: "qualification",
      label: "Qualification",
    },
    {
      key: "salary",
      label: "Salary",
    },
    {
      key: "",
      label: "",
    },
    {
      key: "shift",
      label: "Shift",
    },
    {
      key: "skills",
      label: "Skills",
    },
    {
      key: "title",
      label: "Title",
    },
  ];
  return jobs ? (
    <Table aria-label="Example table with dynamic content">
      <TableHeader columns={columns}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>
      <TableBody items={jobs}>
        {(item) => (
          <TableRow key={item.job_id}>
            {(columnKey) => (
              <TableCell>{getKeyValue(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  ) : null;
}
