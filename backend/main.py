from fastapi import FastAPI
from contextlib import asynccontextmanager
from backend.db.database import database, create_tables
from backend.apis import (
    job_router, 
    users_router
)
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def app_lifespan(app: FastAPI):
    # Startup logic here
    await database.connect()
    create_tables()
    yield
    # Shutdown logic here
    await database.disconnect()

app = FastAPI(lifespan=app_lifespan)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)
app.include_router(job_router, prefix="/jobs", tags=["jobs"])
app.include_router(users_router, prefix="/users", tags=["users"])
