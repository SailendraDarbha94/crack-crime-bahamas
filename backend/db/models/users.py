from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class User(BaseModel):
    email: str
    password: str