from typing import List, Optional
from pydantic import BaseModel, UUID4, Field

class ClinicBase(BaseModel):
    name: str
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    description: Optional[str] = None
    timings: Optional[str] = None
    specialties: Optional[str] = None

class ClinicCreate(ClinicBase):
    pass


class ClinicDetails(ClinicBase):
    clinic_id: UUID4
    owner_profile_id: Optional[UUID4] = None

class ClinicList(BaseModel):
    clinics: List[ClinicDetails] = Field(..., description="List of clinics")

class ClinicUpdate(ClinicBase):
    pass
