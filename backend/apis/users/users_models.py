   
from pydantic import BaseModel, EmailStr
from typing import Literal
from enum import Enum


class UserRole(str, Enum):
    superadmin = "superadmin"
    admin = "admin"
    general = "general"

class User(BaseModel):
    username: str
    email: EmailStr
    password: str  # Store hashed passwords only
    role: UserRole