from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserFeedbackBase(BaseModel):
    user_id: int
    feedback: str

class UserFeedbackCreate(UserFeedbackBase):
    pass

class UserFeedbackUpdate(UserFeedbackBase):
    pass

class UserFeedbackInDBBase(UserFeedbackBase):
    id: int
    timestamp: datetime

    class Config:
        orm_mode = True

# Schema for responses
class UserFeedback(UserFeedbackInDBBase):
    pass

# Schema for requests (if different from response, e.g., no id or timestamp)
class UserFeedbackCreateRequest(UserFeedbackBase):
    pass
