"use client";
import { supabase } from "@/lib/supabase";
import ToastContext from "@/lib/toastContext";
import { Button, Input } from "@nextui-org/react";
import React, { useState, useEffect, useContext } from "react";

const Page = () => {
  const [user, setUser] = useState<any>();
  const [name, setName] = useState<string>("");
  const { toast } = useContext(ToastContext);
  const [file, setFile] = useState<any>(null);
  const [publicUrl, setPublicUrl] = useState<any>(null);

  const getResumeUrl = async (params: string) => {
    const { data } = await supabase.storage
      .from("resumes")
      .getPublicUrl(`/public/${params.split("@")[0]}`);

    console.log(data);
    setPublicUrl(data.publicUrl);
  };
  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        toast("An Error Occured");
      }
      if (data.user?.email) {
        setUser(data.user);
        getResumeUrl(data.user?.email);
      }
    }
    fetchUser();
  }, []);

  const handleUpload = async () => {
    console.log(file);
    const res = await supabase.storage
      .from("resumes")
      .upload(`/public/${user.email.split("@")[0]}`, file, {
        cacheControl: "3600",
        upsert: false,
      });
    if (res) {
      console.log(res);
      toast("File Uploaded Successfully");
      setName("");
      getResumeUrl(user.email);
      setFile(null);
    }
  };

  return (
    <div className="flex flex-wrap w-[99%] mx-auto justify-center min-h-fit">
      <h1 className="w-full text-2xl text-center font-bold">Profile Page</h1>
      {publicUrl ? (
        <div className="w-full flex flex-col justify-between items-center flex-wrap">
          <p className="w-[80%] md:w-1/3 flex flex-row my-2 justify-between"><span>Role :</span> {user.role}</p>
          <p className="w-[80%] md:w-1/3 flex flex-row my-2 justify-between"><span>Email :</span> {user.email}</p>
          <p className="w-[80%] md:w-1/3 flex flex-row my-2 justify-between"><span>Phone :</span> {user.phone ? user.phone : 'N/A'}</p>
          <a
            href={publicUrl}
            target="_blank"
            className="bg-blue-700 block rounded-md m-2 p-2 text-white"
          >
            View Resume
          </a>
        </div>
      ) : (
        <div className="min-h-80 mt-10 w-full">
          <p className="w-full text-center font-serif">
            {file ? "Resume Selected" : "Upload Resume"}
          </p>
          <Input
            className="w-80 block my-2 mx-auto"
            name="resume"
            type="file"
            label=""
            placeholder=""
            onChange={(e: any) => setFile(e.target.files[0])}
          />
          <Input
            className="w-80 block my-2 mx-auto"
            name="name"
            value={name}
            type="text"
            label="File Name"
            placeholder=""
            onChange={(e: any) => setName(e.target.value)}
          />
          <br />
          <Button
            disabled={name.length < 3}
            color={name.length < 3 ? "danger" : "success"}
            variant="flat"
            className="mx-auto block"
            onPress={handleUpload}
          >
            Upload
          </Button>
        </div>
      )}
    </div>
  );
};

export default Page;
