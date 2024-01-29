"use client";
import { httpReq } from "@/lib/http";
import {
  Card,
  CardHeader,
  Divider,
  CardBody,
  Chip,
  CardFooter,
  Button,
  Spinner,
} from "@nextui-org/react";
import router from "next/router";
import { useEffect, useState } from "react";

const Page = ({ params }: { params: { clinicId: string } }) => {
  const { clinicId }: { clinicId: string } = params;
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    async function fetchClinicDetails() {
      setLoading(true);
      const res = await httpReq(`/clinic/get_by_clinic_id/${clinicId}`, "GET");
      const data = await res.json();
      console.log(data);
      setClinic(data);
      setLoading(false);
    }

    fetchClinicDetails();
  }, [params]);

  return (
    <div className="flex w-full min-h-screen justify-center">
      {clinic ? (
        <Card key={clinic.clinic_id} className="w-[99%] min-h-96 max-h-fit shadow-lg my-1">
          <CardHeader className="flex flex-wrap gap-3">
            {/* <Chip className="m-1 text-md">{user.email}</Chip>
                <Chip className="text-small m-1 text-default-500">
                  {clinic.reg_num}
                </Chip> */}
            {/* <Chip className="text-small m-1 text-default-500">
                  Created At {user.created_at.split("T")[0]}
                </Chip>
                <Chip className="text-small m-1 text-default-500">
                  Phone {user.phone ? user.phone : "N/A"}
                </Chip> */}
            <h1 className="text-2xl text-center w-full font-bold">
              {clinic.name}
            </h1>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="flex w-full justify-around">
              <Chip className="text-small m-1 text-default-500">
                Register Number : {clinic.reg_num ? clinic.reg_num : "N/A"}
              </Chip>
              <Chip className="text-small m-1 text-default-500">
                Timings : {clinic.timings ? clinic.timings : "N/A"}
              </Chip>
              <Chip className="text-small m-1 text-default-500">
                Specialties : {clinic.specialties ? clinic.specialties : "N/A"}
              </Chip>
            </div>
            <div className="w-full text-lg text-center">
                <pre>Description : {clinic.description ? clinic.description : 'N/A'}</pre>
            </div>
            <div className="text-lg mt-auto">
                Address : {clinic.address ? clinic.address : 'N/A'}
            </div>
          </CardBody>
          <Divider />
          <CardFooter>
            <Button
              color="danger"
              onPress={() => httpReq(`/clinic/delete/${clinic.clinic_id}`, 'DELETE')}
              variant="flat"
              className="mx-auto text-center"
            >
              Delete Clinic
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div>
          <Spinner size="lg" />
        </div>
      )}
    </div>
  );
};

export default Page;
