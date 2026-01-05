"""
Base model with common fields.
"""
from sqlalchemy import Column, DateTime, String, BigInteger
from sqlalchemy.sql import func
from datetime import datetime
from ..database import Base
import random


def generate_numeric_id():
    """Generate a unique numeric ID (12 digits)."""
    # Generate a 12-digit number (avoids collision with timestamp-based IDs)
    return str(random.randint(100000000000, 999999999999))


class BaseModel(Base):
    """Base model with common fields."""
    __abstract__ = True
    
    id = Column(String(20), primary_key=True, default=generate_numeric_id, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

