import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  console.log(location);

  return (
    <div className="bg-slate-300 p-2 m-2 rounded-md">
      <div className="flex justify-between">
        <Link to="/">
          <p className="font-bold text-xl font-mono rounded-md hover:bg-black hover:text-white px-2">
            AYURYOJ
          </p>
        </Link>
        <div className="flex justify-between min-w-80">
          <div>
            <Link to="/">
              <button className="px-2 rounded-md hover:bg-black hover:text-white h-full">Home</button>
            </Link>
          </div>
          <div>
            {location.pathname === "/" ? (
              <Link to="/login">
                <button className="px-2 rounded-md hover:bg-black hover:text-white h-full">Login</button>
              </Link>
            ) : (
              <Link to="">
                <img src="" alt="" />
                <button className="px-2 rounded-md hover:bg-black hover:text-white h-full">Username</button>
              </Link>
            )}
            {location.pathname === "/dashboard1" &&
            location.pathname !== "/post-a-job" ? (
              <Link to="/post-a-job">
                <button>POST A JOB</button>
              </Link>
            ) : null
            // <Link to="/">
            //   <button>Sign Up</button>
            // </Link>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
