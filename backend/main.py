from fastapi import FastAPI
from backend.apis.user_profile import user_profile_router
from backend.apis.clinics import clinic_router
from backend.apis.jobs import job_router
from backend.apis.auth import auth_router

from backend.db import database

app = FastAPI()

# @app.on_event("startup")
# async def startup():
#     # Initialize Redis and FastAPILimiter here
    
#     # Initialize the FastAPILimiter with the Redis instance
#     # redis_pool = await RedisPoolSingleton.get_redis_pool()
#     await FastAPILimiter.init(redis_pool)
# Include the router
@app.get("/")
async def home():
    return {"message": "Working fine"}
app.include_router(user_profile_router,  prefix="/users")
app.include_router(clinic_router, prefix="/clinic")
app.include_router(job_router, prefix="/jobs")
app.include_router(auth_router, prefix="/auth")

if __name__ == "__main__":
    database.Base.metadata.create_all(bind=database.engine)
