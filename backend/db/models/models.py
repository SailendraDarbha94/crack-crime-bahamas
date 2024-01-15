from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, Boolean, JSONB
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship
from geoalchemy2.types import Geography
from pydantic import BaseModel
from uuid import uuid4
import enum
from base import Base

# SQLAlchemy Models

class UserRoles(enum.Enum):
    applicant = "applicant"
    clinic_owner = "clinic_owner"
    admin = "admin"

class ApplicationStatus(enum.Enum):
    submitted = "submitted"
    reviewed = "reviewed"
    interview = "interview"
    rejected = "rejected"
    hired = "hired"

class Clinic(Base):
    __tablename__ = "clinics"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('auth.users.id'), nullable=False)
    registration_number = Column(String, unique=True, nullable=False)
    address = Column(String, nullable=False)
    location = Column(Geography(geometry_type='POINT', srid=4326))

class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('auth.users.id'), unique=True)
    role = Column(ENUM(UserRoles), nullable=False)

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    clinic_id = Column(Integer, ForeignKey('clinics.id'))
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    qualifications = Column(String)
    salary_range = Column(String)
    location = Column(Geography(geometry_type='POINT', srid=4326))
    created_at = Column(TIMESTAMP)

class UserResume(Base):
    __tablename__ = "user_resumes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'))
    resume_details = Column(String)
    created_at = Column(TIMESTAMP)

class Analytics(Base):
    __tablename__ = "analytics"
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False)
    event_data = Column(JSONB)
    occurred_at = Column(TIMESTAMP)

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey('jobs.id'))
    applicant_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'))
    status = Column(ENUM(ApplicationStatus), nullable=False)
    application_date = Column(TIMESTAMP)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('auth.users.id'))
    message = Column(String, nullable=False)
    seen = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP)

# Pydantic Models for Request/Response

class ClinicBase(BaseModel):
    name: str
    owner_id: UUID
    registration_number: str
    address: str
    location: str  # Use appropriate format for geographic coordinates

class ClinicCreate(ClinicBase):
    pass

class Clinic(ClinicBase):
    id: int

    class Config:
        orm_mode = True

# Define similar Pydantic models for other tables
