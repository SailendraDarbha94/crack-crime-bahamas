from backend.db.supabase import get_supabase_instance,Client
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import logging
from backend.db.models.users import User

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

auth_router = APIRouter(tags=['Auth'])

# Dependency to check if the user is authenticated
def is_authenticated(user):
    if user and user.user.aud == "authenticated":
        return True
    return False

@auth_router.post("/register")
async def register(user: User, supabase: Client = Depends(get_supabase_instance)):
    registration_result = supabase.auth.sign_up({"email": user.email, "password": user.password})
    if not registration_result.user:
        logger.error(f"Registration error for user {user.email}: {registration_result.error.message}")
        raise HTTPException(status_code=400, detail=registration_result.error.message)
    logger.info(f"User {user.email} registered successfully")
    return {"message": "Successfully registered", "data": registration_result.user}

@auth_router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    supabase_client: Client = Depends(get_supabase_instance)
):
    try:
        if not form_data.username or not form_data.password:
            logger.warning("Login attempt with missing username or password.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username and password must be provided.")

        response = supabase_client.auth.sign_in_with_password(
            {
                "email": form_data.username, 
                "password": form_data.password
            }
        )

        if response.user and response.session:
            user = response.user
            access_token = response.session.access_token
            refresh_token = response.session.refresh_token
            return {
                "user": user,
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
        else:
            logger.warning("Invalid login attempt")
            raise HTTPException(status_code=401, detail="Invalid credentials")

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@auth_router.post("/current_user")
async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    supabase: Client = Depends(get_supabase_instance)
):
    try:
        if not token:
            logger.warning("Request Missing Token")
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user = supabase.auth.get_user(token)
        if is_authenticated(user):
            return user
        else:
            logger.warning("Invalid Token")
            raise HTTPException(status_code=401, detail="Invalid token")

    except Exception as e:
        logger.error(f"Error in getting current user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")