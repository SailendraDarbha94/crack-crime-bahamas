from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from geoalchemy2.types import Geography
from backend.db.database import Base 
from pydantic import BaseModel
from typing import List
from datetime import datetime
from typing import Optional

class Job(Base):
    __tablename__ = 'jobs'

    id = Column(Integer, primary_key=True, index=True)
    clinic_id = Column(Integer, ForeignKey('clinics.id'), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    qualifications = Column(Text, nullable=True)
    salary_range = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, nullable=True, default=func.current_timestamp())


class JobCreateRequest(BaseModel):
    clinic_id: Optional[int]
    title: str
    description: str
    qualifications: Optional[str]
    salary_range: Optional[str]

class JobDetailResponse(BaseModel):
    id: int
    clinic_id: Optional[int]
    title: str
    description: str
    qualifications: Optional[str]
    salary_range: Optional[str]
    location: Optional[str]  # Use appropriate format for geographic coordinates
    created_at: datetime

class JobListResponse(BaseModel):
    jobs: List[JobDetailResponse]
