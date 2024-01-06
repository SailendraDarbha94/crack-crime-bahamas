import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <div className="py-[2%] px-[5%]">
      <div className="flex justify-between">
        <div className="">AYURYOJ</div>
        <div className="flex">
          <div>
            <button>Home</button>
            <button>Blog</button>
            <button>About</button>
          </div>
          <div>
            <Link to="/login">
              <button>Login</button>
            </Link>
            <Link to="/signup/client">
              <button>Sign Up</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
