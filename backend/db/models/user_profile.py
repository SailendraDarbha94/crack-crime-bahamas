from sqlalchemy import Column, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum as PyEnum
from pydantic import BaseModel, UUID4, PositiveInt, EmailStr, constr, validator
from typing import List, Optional
from backend.db.models.base import Base

# SQLAlchemy UserRoles Enum
class UserRoles(PyEnum):
    applicant = "applicant"
    clinic_owner = "clinic_owner"
    admin = "admin"

# SQLAlchemy UserProfile Model
class UserProfileBase(BaseModel):
    qualifications: Optional[str] = None
    experience: Optional[PositiveInt] = None
    specializations: Optional[str] = None
    contact_phone: Optional[constr(max_length=255)] = None
    contact_email: Optional[EmailStr] = None
    address_line1: Optional[constr(max_length=255)] = None
    address_line2: Optional[constr(max_length=255)] = None
    city: Optional[constr(max_length=255)] = None
    district: Optional[constr(max_length=255)] = None
    state: Optional[constr(max_length=255)] = None
    country: Optional[constr(max_length=255)] = None
    postal_code: Optional[constr(max_length=255)] = None
    additional_info: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    user_id: UUID4

    @validator("experience", pre=True, always=True)
    def validate_experience(cls, value):
        if value is not None and value < 0:
            raise ValueError("Experience must be a non-negative integer")
        return value

class UserProfile(UserProfileBase):
    profile_id: UUID4
    user_id: UUID4

    class Config:
        from_attributes = True

# Pydantic UserRoles Enum
class UserRolesEnum(str, Enum):
    applicant = "applicant"
    clinic_owner = "clinic_owner"
    admin = "admin"

    # Map the enum values to specific numeric values
    def value_for_role(self):
        if self == UserRolesEnum.admin:
            return 1
        elif self == UserRolesEnum.clinic_owner:
            return 2
        elif self == UserRolesEnum.applicant:
            return 3



