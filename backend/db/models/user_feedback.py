from backend.db.database import Base
from sqlalchemy import Column, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

class UserFeedback(Base):
    __tablename__ = "user_feedback"
    __table_args__ = {"schema":"public"}
    feedback_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False)
    feedback_text = Column(Text)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

