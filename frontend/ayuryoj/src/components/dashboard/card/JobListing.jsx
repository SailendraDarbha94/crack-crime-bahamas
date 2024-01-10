import React from 'react'

const JobListing = () => {
  return (
    <div className='flex'>
        <div className='w-[85%]'>
        <p>position</p>
        <div className='flex'>
        <p>Qualification</p>
        <p>Salary</p>
        </div>
        </div>
        <div className='w-[15%]'>
            <button>Apply Now</button>
        </div>
    </div>
  )
}

export default JobListing