import React from 'react'
import { Link } from 'react-router-dom'
import Logo from '../../../asset/logo.jpg'
import JobListing from './JobListing'

const JobCard = () => {
  return (
    <div className='my-[2%]'>
        <div className='flex'>
            <div className='w-3/4'>
                <div className='flex'>
                    <div className='w-[15%]'>
                        <img src={Logo} alt="Clinic Logo" />
                    </div>
                    <div className='w-[85%]'>
                    <p >D Mettle Clinique</p>
                    </div>
                </div>
                <div>
                    <p>overview</p>
                    <p>Loop is on a mission to fully automate restaurant management so that the restauranteur can focus on their passion of making great quality food. We are building a world where the food entrepreneur finds product market fit super fast, focuses on making great quality food and maintains a great relationship with their audience. Our goal is to use data, automation and ML to reduce their operational workload while making them more money. This will be achieved through a combination of deploying state of the art operational run books, experimentation driven optimisations, making deeply data driven decisions and bringing focus to metrics and behaviours that enable the restaurant to be successful at different levels of the stack.</p>
                </div>
                <div>
                    <JobListing/>
                </div>
            </div>
            <div className='w-1/4'>
                <p>Location</p>
                <p>3rd Floor, Arcadia, 301-A & 303-A, South City II, Sector 49, Gurugram, Haryana 122018</p>
                <Link to="https://www.google.com/maps/dir//3rd+Floor,+Arcadia,+301-A+%26+303-A,+South+City+II,+Sector+49,+Gurugram,+Haryana+122018/@28.4180269,76.9699102,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x390d239fbdefa5f7:0x8b9edf43fa7da185!2m2!1d77.0523116!2d28.4180517?entry=ttu"><p>See on maps</p></Link>
            </div>
        </div>
    </div>
  )
}

export default JobCard