from pydantic import BaseModel, EmailStr, UUID4, validator
from typing import Union, Literal
from enum import Enum
import uuid

class JobType(str, Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"

class QualificationType(str, Enum):
    BDS = "BDS"
    MDS = "MDS"
    Specialist = "Specialist"

class JobPost(BaseModel):
    location: str
    job_type: JobType
    duration: Union[int, Literal['indefinite']]
    qualification: QualificationType
    timings: str
    salary: float