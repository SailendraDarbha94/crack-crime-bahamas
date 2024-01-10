import React, { useState } from 'react'
import { useNavigate } from "react-router-dom";

const LoginForm = () => {

    const navigate = useNavigate();

    const [applicant, setApplicant] = useState({
        username: "",
        password: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setApplicant((prevValue) => {
          return {
            ...prevValue,
            [name]: value,
          };
        });
    };

    const handleClick = (e) => {
        e.preventDefault();
        console.log(applicant);
        if(applicant.username=="devanshu.rastogi05@gmail.com"){
            navigate("/dashboard1")
        } else if(applicant.username=="devanshu.209302150@muj.manipal.edu") {
            navigate("/dashboard2")
        }
    };

  return (
    <div>
      <h1>Login</h1>
      <p>Find the job made for you</p>
      <form>
        <div className="flex">
          <p>Username:</p>
          <input
            name="username"
            onChange={handleChange}
            value={applicant.username}
            placeholder="Enter your username or email"
          />
        </div>
        <div className="flex">
          <p>Password:</p>
          <input
            type="password"
            name="password"
            onChange={handleChange}
            value={applicant.password}
            placeholder="Enter your password"
          />
        </div>
        <button onClick={handleClick}>SIGN IN</button>
      </form>
    </div>
  )
}

export default LoginForm