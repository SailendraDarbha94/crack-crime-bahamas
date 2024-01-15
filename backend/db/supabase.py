from supabase.client import Client, create_client
from decouple import config, UndefinedValueError
from fastapi import HTTPException, status

# Configurations
try:
    SUPABASE_URL = config('SUPABASE_URL')
    SUPABASE_ANON_KEY = config('SUPABASE_ANON_KEY')
except UndefinedValueError:
    raise EnvironmentError("Supabase configurations are not set!")

supabase_client : Client = create_client(supabase_key=SUPABASE_ANON_KEY, supabase_url=SUPABASE_URL)

def get_supabase_instance() -> Client:
    if not supabase_client:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase client is not initialized.")
    return supabase_client