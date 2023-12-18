"use client"

import PostingCard from "@/components/PostingCard"
import { JOBS } from "@/constants/posts"
import { useEffect } from "react"

const Page = () => {

    useEffect(() => {
        async function fetchJobs(url:string) {
            const res  = await fetch(url)
            console.log(res)
            return
        }
        //fetchJobs('https://ayuryoj.azurewebsites.net/')
    },[])

    return (
        <div className="bg-blue-300">
            <h1 className="text-3xl text-center mb-2 py-2">Job Listings</h1>
            <div className="flex flex-col items-center justify-around p-4">
                {JOBS.map((job) =>{
                    return <PostingCard {...job} key={job.id} />
                })}
            </div>
        </div>
    )
}

export default Page