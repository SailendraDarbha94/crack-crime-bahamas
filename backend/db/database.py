# database.py
from sqlalchemy import create_engine, MetaData, Table, Column, String, Integer, Float
from databases import Database
from sqlalchemy.sql.sqltypes import Enum
from backend.users.users_models import UserRole
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(DATABASE_URL)
metadata = MetaData()

job_postings = Table(
    "job_postings",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String),
    Column("location", String),
    Column("job_type", String),
    Column("duration", String),
    Column("qualification", String),
    Column("timings", String),
    Column("salary", Float),
)

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("username", String, unique=True, index=True),
    Column("email", String, unique=True, index=True),
    Column("hashed_password", String),
    Column("role", Enum(UserRole)),
)

database = Database(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
def create_tables():
    metadata.create_all(engine)
