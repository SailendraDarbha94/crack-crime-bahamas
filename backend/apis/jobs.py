from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from backend.db.models.jobs import JobCreateRequest, JobDetailResponse, JobListResponse
from backend.apis.auth import get_current_user
from backend.db.supabase import get_supabase_instance

job_router = APIRouter(tags=['Jobs'])

@job_router.post("/jobs", response_model=JobDetailResponse)
async def create_job(
    job: JobCreateRequest,
    supabase_client: Client = Depends(get_supabase_instance),
    user: dict = Depends(get_current_user)
):
    if user['role'] not in ['admin', 'clinic_owner']:
        raise HTTPException(status_code=403, detail="Access forbidden")

    job_data = job.dict()
    response, error = supabase_client.table('jobs').insert([job_data]).execute()

    if error:
        raise HTTPException(status_code=500, detail=f"Error creating job: {error}")

    return response.data[0]

@job_router.get("/jobs", response_model=JobListResponse)
async def list_jobs(
    supabase_client: Client = Depends(get_supabase_instance)
):
    response, error = supabase_client.table('jobs').select("*").execute()

    if error:
        raise HTTPException(status_code=500, detail=f"Error retrieving jobs: {error}")

    return JobListResponse(jobs=response.data)

@job_router.get("/jobs/{job_id}", response_model=JobDetailResponse)
async def get_job(
    job_id: int,
    supabase_client: Client = Depends(get_supabase_instance)
):
    response, error = supabase_client.table('jobs').select("*").eq('id', job_id).execute()

    if error or not response.data:
        raise HTTPException(status_code=404, detail="Job not found")

    return response.data[0]

@job_router.put("/jobs/{job_id}", response_model=JobDetailResponse)
async def update_job(
    job_id: int,
    job: JobCreateRequest,
    supabase_client: Client = Depends(get_supabase_instance),
    user: dict = Depends(get_current_user)
):
    # Fetch the existing job to check the owner
    existing_job_response, _ = supabase_client.table('jobs').select("*").eq('id', job_id).execute()
    if not existing_job_response.data:
        raise HTTPException(status_code=404, detail="Job not found")

    if user['role'] not in ['admin', 'clinic_owner'] or (user['role'] == 'clinic_owner' and existing_job_response.data[0]['clinic_id'] != user['id']):
        raise HTTPException(status_code=403, detail="Access forbidden")

    update_data = job.dict(exclude_unset=True)
    response, error = supabase_client.table('jobs').update(update_data).eq('id', job_id).execute()

    if error:
        raise HTTPException(status_code=500, detail=f"Error updating job: {error}")

    return response.data[0]

@job_router.delete("/jobs/{job_id}", response_model=dict)
async def delete_job(
    job_id: int,
    supabase_client: Client = Depends(get_supabase_instance),
    user: dict = Depends(get_current_user)
):
    # Fetch the existing job to check the owner
    existing_job_response, _ = supabase_client.table('jobs').select("*").eq('id', job_id).execute()
    if not existing_job_response.data:
        raise HTTPException(status_code=404, detail="Job not found")

    if user['role'] not in ['admin', 'clinic_owner'] or (user['role'] == 'clinic_owner' and existing_job_response.data[0]['clinic_id'] != user['id']):
        raise HTTPException(status_code=403, detail="Access forbidden")
