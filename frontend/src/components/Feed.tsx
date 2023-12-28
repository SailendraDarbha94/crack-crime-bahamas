"use client"

import { JobPosting } from "@/constants"
import { useEffect, useState } from "react"



const Feed = (jobs:any) => {
    // useEffect(() => {
    //     setPosts(jobs)
    // },[jobs])
    // const [posts, setPosts] = useState<any>()
    const jobPosts:JobPosting[] = jobs.jobs
    //const jobsArray = jobs as Array<any>;

    return (
        <div>
            {/* {Array.isArray(jobs.jobs) ? "array" : "not array"} */}
            <div>
                {jobPosts.map((job:any) => {
                    return (
                        <div key={job.id}>
                            title : {job.title}
                            <br />
                            salary : {job.salary}
                            <br />
                            timings : {job.timings}
                            <br />
                            type : {job.type}
                            <br />
                            location : {job.location}
                            <br />
                            qualification : {job.qualification}
                        </div>
                    )
                })}
            </div>
        </div>
        // <div>
        //     Jobs Feed
        //     {jobs ? (
        //         <div>
        //            {posts && posts.map((job:any) => {
        //             return (
        //                 <div>
        //                     <h2>{job.title}</h2>
        //                     <div>
        //                         {job.timings}
        //                         <br />
        //                         {job.location}
        //                         <br />
        //                         {job.type}
        //                         <br />
        //                         {job.qualification}
        //                         <br />
        //                         {job.salary}
        //                     </div>
        //                 </div>
        //             )
        //            })}
        //         </div>
        //     ) : (
        //         <div>
        //             Loading jobs feed
        //         </div>
        //     )}
        // </div>
    )
}

export default Feed