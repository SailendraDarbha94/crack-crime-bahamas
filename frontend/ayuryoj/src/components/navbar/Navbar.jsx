import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {

  const location = useLocation();
  console.log(location)

  return (
    <div className="py-[2%] px-[5%]">
      <div className="flex justify-between">
        <Link to="/"><div className="">AYURYOJ</div></Link>
        <div className="flex">
          <div>
            <Link to="/"><button>Home</button></Link>
            <button>Blog</button>
            <button>About</button>
          </div>
          <div>
            {
              location.pathname==="/"?<Link to="/login">
              <button>Login</button>
            </Link>:<Link to="">
              <img src="" alt="" />
              <button>Username</button>
            </Link>
            }
            {
              location.pathname==="/dashboard1" && location.pathname!=="/post-a-job"?<Link to="/post-a-job">
              <button>POST A JOB</button>
            </Link>:<Link to="/">
              <button>Sign Up</button>
            </Link>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
