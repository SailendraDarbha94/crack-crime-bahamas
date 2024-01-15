from fastapi import APIRouter, HTTPException, Depends, Body
from fastapi.security import OAuth2PasswordBearer
from fastapi import HTTPException, Path
from backend.db.models.user_profile import (
    UserProfileCreate,
    UserProfile,
    UserRolesEnum
)
from backend.db.supabase import get_supabase_instance, Client
from backend.apis.auth import get_current_user
from typing import List
import logging

logger = logging.getLogger(__name__)

user_profile_router = APIRouter(tags=['UserProfiles'])

@user_profile_router.post("/user-profiles/", response_model=UserProfile)
async def create_user_profile(
    profile: UserProfileCreate,
    current_user: dict = Depends(get_current_user),
    supabase_client : Client = Depends(get_supabase_instance)
):
    try:
        # Ensure the user ID in the profile matches the current user's ID
        if str(profile.user_id) != current_user.user.id:
            raise HTTPException(status_code=403, detail="Forbidden: User ID mismatch")

        # Convert Pydantic model to dict
        profile_data = profile.model_dump()
        profile_data["user_id"] = str(profile_data['user_id'])

        # Insert the user profile into the Supabase table
        response = supabase_client.table('user_profiles').upsert([profile_data], on_conflict=['user_id']).execute()

        return response.data[0]
    except Exception as e:
        # Log the exception
        logger.exception(f"Error creating user profile: {e}")
        
        # Raise a generic HTTPException with a 500 status code
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
@user_profile_router.put("/assign-roles/{user_id}/")
async def assign_user_roles(
    user_id: str = Path(..., title="User ID"),
    roles: List[str] = Body(..., title="User Roles"),
    current_user: dict = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_instance)
):
    try:
        #ui will define the role at the time of profile creation
        # # Ensure the current user has the necessary permissions to assign roles
        # if not current_user_is_admin(current_user, supabase_client):
        #     raise HTTPException(status_code=403, detail="Forbidden: Insufficient permissions")

        # Retrieve the user profile from the Supabase table
        user_profile = supabase_client.table('user_profiles').select('*').eq('user_id', str(user_id)).execute().data

        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        role_ids = supabase_client.table("roles") \
            .select("role_id").in_("role_name", roles).execute().data

        # Update user roles in the `user_roles` table
        updated_user_roles = supabase_client.table('user_roles').upsert(
            [{"user_id": str(user_id), "role_id": role_id["role_id"]} for role_id in role_ids]
        ).execute().data
        
        return {"status": "Roles assigned successfully"}
    except Exception as e:
        logger.exception(f"Error assigning user roles: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
def current_user_is_admin(
    current_user: dict = Depends(get_current_user),
    supabase_client: Client = None
    ):
    user_id = current_user.user.id

    # Replace the following logic with your actual query to check if the user has the "admin" role
    admin_query_result = supabase_client.table('user_roles') \
    .select('*') \
    .eq('user_id', user_id) \
    .eq('role_id', UserRolesEnum.value_for_role("admin")) \
    .execute()

    return len(admin_query_result.data)

def current_user_is_owner(
    current_user: dict = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_instance)
    ):
    user_id = current_user.user.id

    # Replace the following logic with your actual query to check if the user has the "admin" role
    admin_query_result = supabase_client.table('user_roles') \
        .select('*') \
        .eq('user_id', str(user_id)) \
        .eq('role_id:roles.role_name', 'owner') \
        .execute().data

    return bool(admin_query_result)

