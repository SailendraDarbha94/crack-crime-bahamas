
export interface Post {
    id: string;
    location: string;
    job_type: string;
    duration: number;
    qualification: string;
    timings: string;
    salary: number;
}

export const JOBS:Post[] = [
    {
        id: "1",
        location: "Bannerghatta",
        job_type: "full_time",
        duration: 10,
        qualification: "MDS",
        timings: "10-18",
        salary: 20000
    },
    {
        id: "2",
        location: "Begur",
        job_type: "part_time",
        duration: 10,
        qualification: "BDS",
        timings: "10-18",
        salary: 20000
    },
]