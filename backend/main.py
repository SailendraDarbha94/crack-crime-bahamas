from fastapi import FastAPI
from contextlib import asynccontextmanager
from backend.database import database, create_tables
from backend.jobs import job_router

@asynccontextmanager
async def app_lifespan(app: FastAPI):
    # Startup logic here
    await database.connect()
    create_tables()
    yield
    # Shutdown logic here
    await database.disconnect()

app = FastAPI(lifespan=app_lifespan)

app.include_router(job_router, prefix="/jobs", tags=["jobs"])
