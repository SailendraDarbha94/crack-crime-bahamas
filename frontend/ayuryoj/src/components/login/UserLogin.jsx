import React from 'react'
import DoctorUrl from "./../../asset/Doctor.png";
import LoginForm from './form/LoginForm'

const UserLogin = () => {
  return (
    <div className="px-[5%] py-[3%]">
      <div className="flex">
        <div className="w-1/2">
          <img src={DoctorUrl} className="w-[70%] mx-auto" alt="Doctor" />
        </div>
        <div className="w-1/2 ">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

export default UserLogin