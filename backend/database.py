# database.py
from sqlalchemy import create_engine, MetaData, Table, Column, String, Integer, Float
from databases import Database
from sqlalchemy.sql.sqltypes import Enum

DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(DATABASE_URL)
metadata = MetaData()

job_postings = Table(
    "job_postings",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("location", String),
    Column("job_type", String),
    Column("duration", String),
    Column("qualification", String),
    Column("timings", String),
    Column("salary", Float),
)

database = Database(DATABASE_URL)

def create_tables():
    metadata.create_all(engine)
