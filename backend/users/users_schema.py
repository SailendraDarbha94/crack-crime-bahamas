from pydantic import BaseModel, EmailStr
from backend.users.users_models import UserRole

class UserBase(BaseModel):
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    role: UserRole

    class Config:
        orm_mode = True
