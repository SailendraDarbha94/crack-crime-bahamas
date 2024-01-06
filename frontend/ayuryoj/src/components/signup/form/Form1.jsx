import React, { useState } from "react";

const Form1 = () => {
  const [client, setClient] = useState({
    fName: "",
    lName: "",
    email: "",
    phoneNo: "",
    qualification: "",
    socialLinkFb: "",
    socialLinkIg: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClient((prevValue) => {
      return {
        ...prevValue,
        [name]: value,
      };
    });
  };

  const handleClick = (e) => {
    e.preventDefault();
    console.log(client);
  };

  return (
    <div>
      <h1>Create an Account</h1>
      <form>
        <div className="flex">
          <p>First Name:</p>
          <input
            name="fName"
            onChange={handleChange}
            value={client.fName}
            placeholder="First Name"
          />
        </div>
        <div className="flex">
          <p>Last Name:</p>
          <input
            name="lName"
            onChange={handleChange}
            value={client.lName}
            placeholder="Last Name"
          />
        </div>
        <div className="flex">
          <p>Email:</p>
          <input
            name="email"
            onChange={handleChange}
            value={client.email}
            placeholder="Email"
          />
        </div>
        <div className="flex">
          <p>Contact No:</p>
          <input
            name="phoneNo"
            onChange={handleChange}
            value={client.phoneNo}
            placeholder="Contact No"
          />
        </div>
        <div className="flex">
          <p>Qualification:</p>
          <input
            name="qualification"
            onChange={handleChange}
            value={client.qualification}
            placeholder="Qualification"
          />
        </div>
        <div className="flex">
          <p>Facebook Link:</p>
          <input
            name="socialLinkFb"
            onChange={handleChange}
            value={client.socialLinkFb}
            placeholder="Fcaebook URL"
          />
        </div>
        <div className="flex">
          <p>Instagram Link:</p>
          <input
            name="socialLinkIg"
            onChange={handleChange}
            value={client.socialLinkIg}
            placeholder="Instagram URL"
          />
        </div>
        <button onClick={handleClick}>SIGN UP</button>
      </form>
    </div>
  );
};

export default Form1;
