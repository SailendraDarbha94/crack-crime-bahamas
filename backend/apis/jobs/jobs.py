from fastapi import APIRouter, HTTPException
from backend.database import job_postings, database
from backend.models import JobPost
from typing import List

job_router = APIRouter()

# Create a new job posting
@job_router.post("/", response_model=JobPost)
async def create_job_posting(job_post: JobPost):
    query = job_postings.insert().values(**job_post.model_dump())
    last_record_id = await database.execute(query)
    return {**job_post.model_dump(), "id": last_record_id}

# Get a list of all job postings
@job_router.get("/", response_model=List[JobPost])
async def read_job_postings():
    query = job_postings.select()
    return await database.fetch_all(query)

# Get a single job posting by ID
@job_router.get("/{job_id}", response_model=JobPost)
async def read_job_posting(job_id: int):
    query = job_postings.select().where(job_postings.c.id == job_id)
    job_post = await database.fetch_one(query)
    if job_post is None:
        raise HTTPException(status_code=404, detail="Job posting not found")
    return job_post

# Update a job posting
@job_router.put("/{job_id}", response_model=JobPost)
async def update_job_posting(job_id: int, job_post: JobPost):
    query = job_postings.update().where(job_postings.c.id == job_id).values(**job_post.dict())
    await database.execute(query)
    return {**job_post.model_dump(), "id": job_id}

# Delete a job posting
@job_router.delete("/{job_id}", response_model=JobPost)
async def delete_job_posting(job_id: int):
    query = job_postings.delete().where(job_postings.c.id == job_id)
    await database.execute(query)
    return {"message": "Job posting deleted successfully"}
