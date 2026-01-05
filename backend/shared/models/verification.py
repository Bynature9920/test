"""
Verification models.
"""

import enum
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, Enum as SQLEnum
from .base import BaseModel
import uuid
from datetime import datetime

class VerificationStatus(str, enum.Enum):
    """Verification status enum."""
    NOT_STARTED = "not_started"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

class VerificationDocument(BaseModel):
    """Verification document model."""
    __tablename__ = "verification_documents"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    country_code = Column(String(2), nullable=False)  # ISO country code
    document_type = Column(String(50), nullable=False)  # passport, drivers_license, voters_card, nin
    document_side = Column(String(10), nullable=True)  # front, back (for driver's license)
    file_url = Column(String(500), nullable=False)  # URL to stored document
    status = Column(SQLEnum(VerificationStatus), nullable=False, default=VerificationStatus.PENDING)
    submitted_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(36), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<VerificationDocument(id={self.id}, user_id={self.user_id}, type={self.document_type}, status={self.status})>"



