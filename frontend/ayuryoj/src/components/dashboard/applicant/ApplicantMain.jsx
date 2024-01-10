import React from 'react'
import JobCard from '../card/JobCard'

const ApplicantMain = () => {
  return (
    <div className="py-[2%] px-[5%]">
      <div className="flex">
        <h1 className="w-[80%]">Search for Jobs</h1>
      </div>
      <div>
        {/* {
            arr.map((item) => {
                return <ClinicCard key={item.id} regno={item.regno} name={item.clinicName} overview={item.overview} location={item.location}/>;
            })
        } */}
        <JobCard/>
      </div>
    </div>
  )
}

export default ApplicantMain