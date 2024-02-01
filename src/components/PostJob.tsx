import { supabase } from "@/lib/supabase";
import ToastContext from "@/lib/toastContext";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
  divider,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";

const PostJob = ({ clinicId, address }: any) => {
  const [qualification, setQualification] = useState<string>("");
  const [shift, setShift] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [experience, setExperience] = useState<string>("");
  const [skills, setSkills] = useState<string>("");
  const [salary, setSalary] = useState<string>("");
  //const [location, setLocation] = useState<string>("");
  const [user, setUser] = useState<any>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");

  useEffect(() => {
    async function fetchUser() {
      const {data} = await supabase.auth.getUser()
      if(data){
        setUser(data.user)
      }
    }
    fetchUser()
  },[])

  const router = useRouter();
  const {toast} = useContext(ToastContext);

  const createJob = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          qualification,
          shift,
          description,
          experience,
          skills,
          salary,
          location : address,
          title,
          clinic_id: clinicId,
          job_poster_id: user.id,
        },
      ])
      .select();

    if (error) {
      toast("An Error Occured! Please try again later")
      console.error(error);
    }
    if (data) {
      toast("Job Posted Successfully")
      console.log(data);
      router.refresh()
    }
  };

  return (
    <div className="flex flex-wrap w-full">
      <div className="flex flex-col w-2/3 items-center mx-auto">
      <Input
          className="w-80 my-2"
          name="title"
          value={title}
          type="text"
          label="Job Title"
          placeholder=""
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          className="w-80 my-2"
          name="qualification"
          value={qualification}
          type="text"
          label="Qualification"
          placeholder=""
          onChange={(e) => setQualification(e.target.value)}
        />
        <Input
          className="w-80 my-2"
          name="shift"
          value={shift}
          type="text"
          label="Shift"
          placeholder=""
          onChange={(e) => setShift(e.target.value)}
        />
        <Input
          className="w-80 my-2"
          name="description"
          value={description}
          type="text"
          label="Description"
          placeholder=""
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          className="w-80 my-2"
          name="experience"
          value={experience}
          type="text"
          label="Experience"
          placeholder=""
          onChange={(e) => setExperience(e.target.value)}
        />
        <Input
          className="w-80 my-2"
          name="skills"
          value={skills}
          type="text"
          label="Skills"
          placeholder=""
          onChange={(e) => setSkills(e.target.value)}
        />
        <Input
          className="w-80 my-2"
          name="salary"
          value={salary}
          type="text"
          label="Salary"
          placeholder=""
          onChange={(e) => setSalary(e.target.value)}
        />
        {/* <Select
          label=""
          placeholder="Select the clinic"
          className="max-w-xs"
          onClick={fetchUserClinics}
        >
          {clinics &&
            clinics.map((clinic: any) => (
              <SelectItem
                key={clinic.clinic_id}
                aria-label="select item"
                value={clinic.address}
                onClick={() => {
                  setLocation(clinic.address), setTitle(clinic.name);
                }}
              >
                {clinic.name}
              </SelectItem>
            ))}
        </Select> */}
        {/* <Input
          //disabled
          className="w-80 my-2"
          name="address"
          value={location}
          type="text"
          label=""
          placeholder=""
          onChange={(e) => setLocation(e.target.value)}
        />
        */}
      </div> 
      <div className="w-full text-center max-h-fit">
        <Button
          color="secondary"
          onPress={createJob}
          variant="flat"
          className="mx-auto mb-2"
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default PostJob;
