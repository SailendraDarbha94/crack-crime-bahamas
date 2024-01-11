import React from "react";
import ClinicCard from "../card/ClinicCard";

const ClientMain = () => {

    const arr = [{id: 1, regno: "209302150", clinicName: "D Mettle Clinique", overview: "Best and Top Doctors Opd Clinic In Gurugram/Gurgaon", location: "3rd Floor, Arcadia, 301-A & 303-A, South City II, Sector 49, Gurugram, Haryana 122018"}, {id: 2, regno: "209302150", clinicName: "D Mettle Clinique", overview: "Best and Top Doctors Opd Clinic In Gurugram/Gurgaon", location: "3rd Floor, Arcadia, 301-A & 303-A, South City II, Sector 49, Gurugram, Haryana 122018"}];

  return (
    <div className="py-[2%] px-[5%]">
      <div className="flex">
        <h1 className="w-[80%]">Clinics</h1>
        <button className="w-[10%]">Add Clinic +</button>
        <button className="w-[10%]">Remove Clinic -</button>
      </div>
      <div>
        {
            arr.map((item) => {
                return <ClinicCard key={item.id} regno={item.regno} name={item.clinicName} overview={item.overview} location={item.location}/>;
            })
        }
      </div>
    </div>
  );
};

export default ClientMain;
