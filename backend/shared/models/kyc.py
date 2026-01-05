"""
KYC models.
"""
from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum, Date, Text
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class KYCStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class KYCVerification(BaseModel):
    """KYC verification model."""
    __tablename__ = "kyc_verifications"
    
    user_id = Column(String(20), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    status = Column(SQLEnum(KYCStatus), nullable=False, default=KYCStatus.PENDING)
    provider_verification_id = Column(String(100), nullable=True)  # External provider ID
    
    # Personal Information
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    middle_name = Column(String(100), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    nationality = Column(String(2), nullable=True)
    
    # Identification
    id_type = Column(String(50), nullable=True)  # NIN, PASSPORT, DRIVERS_LICENSE
    id_number = Column(String(100), nullable=True)
    id_issue_date = Column(Date, nullable=True)
    id_expiry_date = Column(Date, nullable=True)
    
    # Address
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(2), nullable=True)
    
    # Documents
    id_front_url = Column(Text, nullable=True)
    id_back_url = Column(Text, nullable=True)
    selfie_url = Column(Text, nullable=True)
    proof_of_address_url = Column(Text, nullable=True)
    
    # Verification Details
    verified_at = Column(String(50), nullable=True)
    verified_by = Column(String(20), nullable=True)  # Admin user ID
    rejection_reason = Column(Text, nullable=True)
    provider_response = Column(Text, nullable=True)  # JSON string

