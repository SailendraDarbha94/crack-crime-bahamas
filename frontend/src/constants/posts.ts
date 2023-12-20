
export interface Post {
    id: string;
    title: string;
    location: string;
    type: string;
    duration: number;
    qualification: string;
    timings: string;
    salary: number;
}

export const JOBS:Post[] = [
    {
        id: "1",
        title: "Dentist needed for bommasandra",
        location: "Bannerghatta",
        type: "full_time",
        duration: 10,
        qualification: "MDS",
        timings: "10-18",
        salary: 20000
    },
    {
        id: "2",
        title: "Opening for immediate joining",
        location: "Begur",
        type: "part_time",
        duration: 10,
        qualification: "BDS",
        timings: "10-18",
        salary: 20000
    },
]