import React from "react";
import DoctorUrl from "./../../asset/Doctor.png";
import { Link } from "react-router-dom";

const HeroBanner = () => {
  return (
    <div className="px-[5%] py-[3%]">
      <div className="flex">
        <div className="w-1/2">
          <img src={DoctorUrl} className="w-[70%] mx-auto" alt="Doctor" />
        </div>
        <div className="w-1/2 ">
          <div className="w-1/2 mx-auto">
            <p>Dental Jobs Search Made Easy</p>
            <div className="flex">
              <Link to="/signup/client">
                <button>I want to hire.</button>
              </Link>
              <button>I want to get hired.</button>
            </div>
            <Link to="/login"><p>I already have an account</p></Link>
            <div className="flex">
              <button>Signup using Gmail</button>
              <button>Signup using Facebook</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
