# https://fastapi.tiangolo.com/tutorial/sql-databases/#migrations
from sqlalchemy import create_engine,Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from decouple import config

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:g7xZbQ0JTlVHksBM@db.clfdysmwypbvjfhuimyz.supabase.co:5432/postgres"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
