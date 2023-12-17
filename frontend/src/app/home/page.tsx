"use client"

import PostingCard from "@/components/PostingCard"

const Page = () => {
    
    return (
        <div className="bg-blue-300">
            <h1 className="text-3xl text-center mb-2 py-2">Job Listings</h1>
            <div className="flex flex-col items-center justify-around p-4">
                <PostingCard />
            </div>
        </div>
    )
}

export default Page