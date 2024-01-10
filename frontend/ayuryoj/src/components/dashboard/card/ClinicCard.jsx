import React from "react";
import Logo from "../../../asset/logo.jpg";

const ClinicCard = ({ regno, name, overview, location }) => {
  return (
    <div className="my-[2%]">
      <div className="flex">
        <div className="w-[15%]">
          <img src={Logo} alt="Clinic Logo" />
        </div>
        <div className="w-[85%]">
          <div className="flex justify-end">
            <button>Edit Clinic</button>
          </div>
          <div>
            <p>Reg no: {regno}</p>
            <p>{name}</p>
            <p>{overview}</p>
            <p>{location}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
