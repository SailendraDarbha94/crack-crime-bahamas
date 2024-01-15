# Import necessary libraries and modules
from fastapi import Depends, HTTPException, APIRouter
from supabase import Client
from backend.db.supabase import get_supabase_instance
from backend.apis.auth import get_current_user
from backend.db.models.clinics import (
    ClinicCreate, 
    ClinicDetails, 
    ClinicList
    )

# Initialize API router
clinic_router = APIRouter(tags=['Clinic'])

# CRUD operations for Clinic

# Create Clinic
@clinic_router.post("/create/", response_model=ClinicDetails)
def create_clinic(
    clinic_data: ClinicCreate,
    supabase_client: Client = Depends(get_supabase_instance),
    user: dict = Depends(get_current_user)
):
    if not user.user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = user.user.id
    clinic_data_dict = clinic_data.model_dump()
    user_profile_id = supabase_client.table("user_profiles")\
        .select("profile_id")\
        .eq("user_id", user_id)\
        .execute().data
    clinic_data_dict['owner_profile_id'] = user_profile_id[0]["profile_id"]
    
    response = supabase_client.table('clinics').insert([clinic_data_dict]).execute()

    if not len(response.data):
        raise HTTPException(status_code=500, detail="Internal server error")

    return response.data[0]

# Read Clinic Details
@clinic_router.get("/get/{clinic_id}", response_model=ClinicDetails)
def read_clinic(
    clinic_id: str,
    supabase_client: Client = Depends(get_supabase_instance),
    user: dict = Depends(get_current_user)
):
    response = supabase_client.table('clinics').select("*").eq('clinic_id', clinic_id).execute()
    
    # if error[1] or not response[1]:
    #     raise HTTPException(status_code=404, detail="Clinic not found")
    clinic_dict = response[1][0]
    clinic_response = ClinicDetails(
                id=clinic_dict['id'],
                name=clinic_dict['name'],
                owner_id=clinic_dict['owner_id'],
                registration_number=clinic_dict['registration_number'],
                address=clinic_dict['address'],
                location=clinic_dict['location']
            )
    return clinic_response

# Update Clinic
@clinic_router.put("/update/{clinic_id}", response_model=ClinicDetails)
def update_clinic(
    clinic_id: int,
    clinic_data: ClinicCreate,
    supabase_client: Client = Depends(get_supabase_instance),
    user: dict = Depends(get_current_user)
):
    user_id = user['user']['id']
    existing_clinic, _ = supabase_client.table('clinics').select("*").eq('id', clinic_id).execute()

    if not existing_clinic.data or existing_clinic.data[0]['owner_id'] != user_id:
        raise HTTPException(status_code=403, detail="Access forbidden for this user")

    update_data = clinic_data.dict()
    response, error = supabase_client.table('clinics').update(update_data).eq('id', clinic_id).execute()

    if error:
        raise HTTPException(status_code=500, detail="Internal server error")

    return response.data[0]

# Delete Clinic
@clinic_router.delete("/delete/{clinic_id}", response_model=dict)
def delete_clinic(
    clinic_id: int,
    supabase_client: Client = Depends(get_supabase_instance),
    user: dict = Depends(get_current_user)
):
    user_id = user['user']['id']
    existing_clinic, _ = supabase_client.table('clinics').select("*").eq('id', clinic_id).execute()

    if not existing_clinic.data or existing_clinic.data[0]['owner_id'] != user_id:
        raise HTTPException(status_code=403, detail="Access forbidden for this user")

    _, error = supabase_client.table('clinics').delete().eq('id', clinic_id).execute()

    if error:
        raise HTTPException(status_code=500, detail="Internal server error")

    return {"message": "Clinic deleted successfully"}

# List Clinics
@clinic_router.get("/list_clinics/")
def list_clinics(
    supabase_client: Client = Depends(get_supabase_instance),
    user: dict = Depends(get_current_user)
):
    user_id = user.user.id
    user_profile_id = supabase_client.table("user_profiles")\
        .select("profile_id")\
        .eq("user_id", user_id)\
        .execute().data[0]["profile_id"]
        
    response = supabase_client.table('clinics').select("*")\
        .eq("owner_profile_id",user_profile_id ).execute()
    #overview

    return response.data

# Add the router to the main app

#Get Clinics for job/owner
#Job id - > clinic id
#response list of clinics 
    """
    Name
    type city, districts
    contact info
    """
    


