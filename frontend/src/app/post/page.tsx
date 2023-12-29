import Feed from "@/components/Feed"
import { JobPosting } from "@/constants"
import { db } from "@/db"

 


const Page = async () => {
    const posts:any = await db.jobPosting.findMany()
    // console.log(JSON.stringify(posts))
    // const jobPosts:JobPosting[] = posts.jobs

    return <Feed jobs={posts} />
}

export default Page