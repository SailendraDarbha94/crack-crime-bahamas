"use client";
import { httpReq } from "@/lib/http";
import { supabase } from "@/lib/supabase";
import ToastContext from "@/lib/toastContext";
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
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

const Page = ({ params }: { params: { clinicId: string } }) => {
  const { clinicId }: { clinicId: string } = params;
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [jobs, setJobs] = useState<any>(null);
  async function fetchClinicDetails() {
    setLoading(true);
    const res = await httpReq(`/clinic/get_by_clinic_id/${clinicId}`, "GET");
    const data = await res.json();
    console.log(data);
    setClinic(data);
    setLoading(false);
  }

  async function fetchJobsList() {
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("clinic_id", clinicId);
    console.log(jobs);
    setJobs(jobs);
  }

  useEffect(() => {
    fetchJobsList();
    fetchClinicDetails();
  }, [params]);

  const { toast } = useContext(ToastContext);
  const router = useRouter();
  async function deleteClinic() {
    const res = await httpReq(`/clinic/delete/${clinic.clinic_id}`, "DELETE");
    if (res.status === 200) {
      toast("Clinic Deleted");
      router.back();
    }
  }

  return (
    <div className="flex w-full min-h-screen justify-center">
      {clinic ? (
        <Card
          key={clinic.clinic_id}
          className="w-[99%] min-h-96 max-h-fit shadow-lg my-1"
        >
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
          <Button
            color="success"
            onPress={deleteClinic}
            variant="flat"
            className="mx-auto my-2 text-center"
          >
            Post a Job
          </Button>
          <Divider />
          <CardBody>
            <div className="flex flex-wrap w-full justify-around">
              <div className="text-md m-1 bg-gray-300 rounded-2xl px-2 py-1 text-wrap text-default-500">
                Address : {clinic.address ? clinic.address : "N/A"}
              </div>
              <div className="text-md m-1 bg-gray-300 rounded-2xl px-2 py-1 text-wrap text-default-500">
                Register Number : {clinic.reg_num ? clinic.reg_num : "N/A"}
              </div>
              <div className="text-md m-1 bg-gray-300 rounded-2xl px-2 py-1 text-wrap text-default-500">
                Timings : {clinic.timings ? clinic.timings : "N/A"}
              </div>
              <div className="text-md m-1 bg-gray-300 rounded-2xl px-2 py-1 text-wrap text-default-500">
                Specialties : {clinic.specialties ? clinic.specialties : "N/A"}
              </div>
            </div>
            <div className="w-full text-lg text-center">
              <p>
                Description : {clinic.description ? clinic.description : "N/A"}
              </p>
            </div>
            <div className="w-full mt-10">
              <p className="text-center block text-lg font-semibold underline">
                Posted Jobs
              </p>
              <div className="flex flex-col items-center">
                {jobs &&
                  jobs.map((job: any) => {
                    return (
                      <div
                        key={job.job_id}
                        className="min-w-96 font-thin bg-blue-200 rounded-lg p-2"
                      >
                        Title : {job.title}
                        <br />
                        Applicants :{" "}
                        <pre className="inline">
                          <code className="text-wrap">{job.applicants}</code>
                        </pre>
                      </div>
                    );
                  })}
              </div>
            </div>
          </CardBody>
          <Divider />
          <CardFooter>
            <Button
              color="danger"
              onPress={deleteClinic}
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
