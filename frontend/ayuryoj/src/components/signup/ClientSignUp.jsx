import React from "react";
import DoctorUrl from "./../../asset/Doctor.png";
import Form1 from "./form/Form1";

const ClientSignUp = () => {
  return (
    <div className="px-[5%] py-[3%]">
      <div className="flex">
        <div className="w-1/2">
          <img src={DoctorUrl} className="w-[70%] mx-auto" alt="Doctor" />
        </div>
        <div className="w-1/2 ">
          <Form1 />
        </div>
      </div>
    </div>
  );
};

export default ClientSignUp;
