"""
Base model with common fields.
"""
from sqlalchemy import Column, DateTime, String
from sqlalchemy.sql import func
from datetime import datetime
from ..database import Base
import uuid


def generate_uuid():
    """Generate a UUID string."""
    return str(uuid.uuid4())


class BaseModel(Base):
    """Base model with common fields."""
    __abstract__ = True
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

