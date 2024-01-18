"use client"

import { Button, Input } from "@nextui-org/react";
import { emitWarning } from "process";
import { useState } from "react";

export default function page () {

    const [client, setClient] = useState<any>({
        email: "",
        password: "",
        confirmPassword: ""
    })

    const handleChange = (e) => {
        const { name, value } = e.target;
        setClient((prevValue) => {
          return {
            ...prevValue,
            [name]: value,
          };
        });
      };
    

    function validateEmail() {
        console.log(client)
        const re:any = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        console.log(re.test(client.email))
        return re.test(client.email);
    }



    return (
        <div className="flex flex-col w-full min-h-screen items-center">
            <p className="block w-full bg-red-200 text-center">new auth route</p>
            <Input className="w-80 my-2" name="email" value={client.email} type="email" label="Email" placeholder="Enter your email" onChange={handleChange} />
            <Input className="w-80 my-2" name="password" value={client.password} type="password" label="Password" placeholder="Choose a password" onChange={handleChange} />
            <Input className="w-80 my-2" name="confirmPassword" value={client.confirmPassword} type="password" label="Confirm Password" placeholder="Enter your password again" onChange={handleChange} />
            <Button onClick={validateEmail} className="">Check Email</Button>
        </div>
    )
}