//@ts-nocheck
"use client";
import React, { useContext, useEffect, useState } from "react";
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
  Divider,
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
import ToastContext from "@/lib/toastContext";
const statusColorMap = {
  active: "success",
  paused: "danger",
  vacation: "warning",
};

export default function JobsList() {
  const [jobs, setJobs] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      const user = await data.user;
      if (user) {
        setUser(user);
      }
    };

    const fetchJobsList = async () => {
      let { data: jobs, error } = await supabase.from("jobs").select("*")
      
      if (error) {
        console.error(error);
      }
      if (jobs) {
        console.log(jobs);
        setJobs(jobs);
      }
    };
    fetchUser();
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
  // const columns = [
  //   {
  //     key: "created_at",
  //     label: "Posted At",
  //   },
  //   {
  //     key: "description",
  //     label: "Desc.",
  //   },
  //   {
  //     key: "experience",
  //     label: "Exp",
  //   },
  //   {
  //     key: "location",
  //     label: "Address",
  //   },
  //   {
  //     key: "qualification",
  //     label: "Qualification",
  //   },
  //   {
  //     key: "salary",
  //     label: "Salary",
  //   },
  //   {
  //     key: "",
  //     label: "",
  //   },
  //   {
  //     key: "shift",
  //     label: "Shift",
  //   },
  //   {
  //     key: "skills",
  //     label: "Skills",
  //   },
  //   {
  //     key: "title",
  //     label: "Title",
  //   },
  // ];
  const { toast } = useContext(ToastContext);


  async function applyJob(post: any) {
    console.log(post);
    let {data:applicants} = await supabase.from("jobs").select('applicants').eq('job_id', post.job_id)
    let oldApplicants = await applicants[0].applicants
    let newApplicants = await [user.email, ...oldApplicants]
    console.log(applicants)
    const { data, error } = await supabase
      .from("jobs")
      .update({ applicants: newApplicants })
      .eq('job_id', post.job_id)
      .select();

    if (error) {
      toast("Error Occured! Please Apply Again Later");
    }
    if (data) {
      toast("Job Applied");
      console.log(data);
    }
  }
  return (
    // <Table aria-label="Example table with dynamic content">
    //   <TableHeader columns={columns}>
    //     {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
    //   </TableHeader>
    //   <TableBody items={jobs}>
    //     {(item) => (
    //       <TableRow key={item.job_id}>
    //         {(columnKey) => (
    //           <TableCell>{getKeyValue(item, columnKey)}</TableCell>
    //         )}
    //       </TableRow>
    //     )}
    //   </TableBody>
    // </Table>
    <div className="w-full flex flex-col">
      {jobs &&
        jobs.map((job: any) => {
          return (
            <div
              key={job.job_id}
              className="bg-slate-200 shadow-lg rounded-md w-[95%] md:w-[80%] min-h-24 mx-auto"
            >
              <p className="w-full my-2 text-center text-2xl font-semibold">
                {job.title}
              </p>
              <Divider />
              <div className="flex flex-wrap">
                <div className="text-md m-1 bg-gray-300 rounded-2xl px-2 py-1 text-wrap text-default-500">
                  Address : {job.location}
                </div>
                <div className="text-md m-1 bg-gray-300 rounded-2xl px-2 py-1 text-wrap text-default-500">
                  Qualification : {job.qualification}
                </div>
                <div className="text-md m-1 bg-gray-300 rounded-2xl px-2 py-1 text-wrap text-default-500">
                  Experience : {job.experience}
                </div>
                <div className="text-md m-1 bg-gray-300 rounded-2xl px-2 py-1 text-wrap text-default-500">
                  Salary : {job.salary}
                </div>
                <div className="text-md m-1 bg-gray-300 rounded-2xl px-2 py-1 text-wrap text-default-500">
                  Skills : {job.skills}
                </div>
                <div className="text-md m-1 bg-gray-300 rounded-2xl px-2 py-1 text-wrap text-default-500">
                  Shift : {job.shift}
                </div>
              </div>
              <Divider />
              <div className="w-full">
                <Button
                  color="secondary"
                  variant="flat"
                  className="mx-auto block my-2"
                  onPress={() => applyJob(job)}
                >
                  Apply
                </Button>
              </div>
            </div>
          );
        })}
    </div>
  );
}
