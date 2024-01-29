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
  CardHeader,
  Chip,
  CardBody,
  Divider,
  CardFooter,
  Button,
  Card,
  Spinner,
} from "@nextui-org/react";
import { httpReq } from "@/lib/http";
import { useRouter } from "next/navigation";

const ClinicsList = () => {
  //const [loading, setLoading] = useState<boolean>(false)
  const [clinics, setClinics] = useState<any>(null);
  const router = useRouter();
  useEffect(() => {
    async function fetchClinics() {
      const res = await httpReq("/clinic/list_all_clinics/", "GET");
      const data = await res.json();

      if (data) {
        console.log(data);
        setClinics(data);
      }
    }
    fetchClinics();
  }, []);

  // const columns = [
  //   // {
  //   //     key: "clinic_id",
  //   //     label: "Id"
  //   // },
  //   {
  //     key: "name",
  //     label: "Name",
  //   },
  //   {
  //     key: "reg_num",
  //     label: "Reg. No.",
  //   },
  //   {
  //     key: "specialties",
  //     label: "Specialties",
  //   },
  //   {
  //     key: "timings",
  //     label: "Timings",
  //   },
  //   {
  //     key: "address",
  //     label: "Address",
  //   },
  // ];
  return (
    <div className="w-[99%] mx-auto">
      {/* <Table
        aria-label="Example table with dynamic content"
        shadow="lg"
        isStriped
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn width={20} key={column.key}>
              {column.label}
            </TableColumn>
          )}
        </TableHeader> */}
      {
        clinics
          ? // <TableBody items={clinics}>
            //   {(item: any) => (
            //     <TableRow key={item.clinic_id}>
            //       {(columnKey) => (
            //         <TableCell>{getKeyValue(item, columnKey)}</TableCell>
            //       )}
            //     </TableRow>
            //   )}
            // </TableBody>
            clinics.map((clinic: any) => {
              return (
                <Card key={clinic.clinic_id} className="w-full my-2 shadow-xl">
                  <CardHeader className="flex flex-wrap gap-3">
                    <h1 className="text-xl text-center w-full font-bold">
                      {clinic.name}
                    </h1>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <div className="flex w-full justify-around">
                      <Chip className="text-small m-1 text-default-500">
                        Register Number :{" "}
                        {clinic.reg_num ? clinic.reg_num : "N/A"}
                      </Chip>
                      <Chip className="text-small m-1 text-default-500">
                        Timings : {clinic.timings ? clinic.timings : "N/A"}
                      </Chip>
                      <Chip className="text-small m-1 text-default-500">
                        Specialties :{" "}
                        {clinic.specialties ? clinic.specialties : "N/A"}
                      </Chip>
                    </div>
                  </CardBody>
                  <Divider />
                  <CardFooter>
                    <Button
                      color="secondary"
                      onPress={() =>
                        router.push(`/clinics/${clinic.clinic_id}`)
                      }
                      variant="flat"
                      className="mx-auto text-center"
                    >
                      View Clinic
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          : null
        // (
        //   <TableBody emptyContent={"Loading Data..."}>{[]}</TableBody>
        // )
      }
      {/* </Table> */}
    </div>
  );
};
export default ClinicsList;
