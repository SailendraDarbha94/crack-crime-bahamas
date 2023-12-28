export interface JobPosting {
    id: number;
    title?: string | null;
    salary: number;
    timings: string;
    location: string;
    type: JobType;
    qualification: string;
}

enum JobType {
    FullTime = "FULL_TIME",
    PartTime = "PART_TIME"
  }