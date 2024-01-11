import React from "react";
import Navbar from "./../../components/navbar/Navbar";
import HeroBanner from "./../../components/homepage/HeroBanner";
import { Link } from "react-router-dom";

const Homepage = () => {
  return (
    <>
      <Navbar />
      <HeroBanner />
      <Link to="/feed">
        <button className="px-2 rounded-md hover:bg-black hover:text-white h-full">
          Feed
        </button>
      </Link>
    </>
  );
};

export default Homepage;
