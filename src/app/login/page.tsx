"use client";

import { supabase } from "@/lib/supabase";
import { Button, Input } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function page() {
  // const httpReq = async (params:any) => {
  //   const res = await fetch('https://ayuryoj-backend.pankh.ai/auth/register', {
  //     method: 'POST',
  //     body: JSON.stringify(params),
  //     headers: {
  //       'Content-Type': 'application/json',
  //     }
  //   })
  //   console.log(res)
  //   const data = await res.json()
  //   console.log(data)
  // }

  const [disabler, setDisabler] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  //   const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  // const [client, setClient] = useState<any>({
  //   email: "",
  //   password: "",
  //   confirmPassword: "",
  // });
  const router = useRouter();
  //   async function handlePasswordInput() {
  //     if (password !== "" && confirmPassword !== "") {
  //       if (password === confirmPassword && password.length > 3) {
  //         setDisabler(false);
  //       } else {
  //         setDisabler(true);
  //       }
  //     } else {
  //       setDisabler(true);
  //     }
  //   }

  //   useEffect(() => {
  //     handlePasswordInput();
  //   }, [password, confirmPassword]);

  // const handleChange = (e: any) => {
  //   handlePasswordInput()
  //   const { name, value } = e.target;
  //   setClient((prevValue: any) => {
  //     return {
  //       ...prevValue,
  //       [name]: value,
  //     };
  //   })
  // };

  // function validateEmail() {
  // const re: any =
  //  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  // console.log(re.test(client.email));
  // if(re.test(client.email) === false){
  //   window.alert("Invalid Email")
  // }
  // return re.test(email);
  // }

  async function handleSubmit() {
    setLoading(true);
    // const validated: boolean = await validateEmail();
    // if (!validated) {
    //   window.alert("Invalid Email");
    //   return;
    // }
    //  return await httpReq({ email: email, password: password})
    //  console.log(JSON.stringify({ email: email, password: password}))

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (data) {
      console.log(data);
    }

    if (error) {
      console.log(error);
      window.alert("An Error Occured! Please try again later");
      return;
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-start bg-transparent w-[99%] mx-auto shadow-lg rounded-lg">
      {/* <p className="block w-full bg-red-200 text-center">new auth route</p> */}
      <div className="py-10 my-10">
        <Input
          className="w-80 my-2"
          name="email"
          value={email}
          type="email"
          label="Email"
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          className="w-80 my-2"
          name="password"
          value={password}
          type="password"
          label="Password"
          placeholder="Choose a password"
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {loading ? (
        <p>Loading</p>
      ) : (
        <Button
          color={disabler ? "danger" : "success"}
          variant="flat"
          onClick={handleSubmit}
          className={
            disabler ? "hover:cursor-not-allowed" : "hover:cursor-pointer"
          }
          disabled={disabler}
        >
          Submit
        </Button>
      )}
    </div>
  );
}
