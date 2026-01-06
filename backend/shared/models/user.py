"""
User model.
"""
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class KYCStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class User(BaseModel):
    """User model."""
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=True, index=True)  # Made nullable for Google OAuth
    password_hash = Column(String(255), nullable=True)  # Made nullable for Google OAuth
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    country_code = Column(String(2), nullable=False, default="NG")
    kyc_status = Column(SQLEnum(KYCStatus), nullable=False, default=KYCStatus.PENDING)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # OAuth fields (unique constraint handled at app level for NULL values)
    google_id = Column(String(255), nullable=True, index=True)  # Removed unique=True to allow multiple NULLs
    oauth_provider = Column(String(50), nullable=True)  # 'google', 'facebook', etc.
    
    # Password reset fields
    reset_token = Column(String(255), nullable=True, index=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    wallets = relationship("Wallet", back_populates="user", lazy="dynamic")
    transactions = relationship("Transaction", back_populates="user", lazy="dynamic")

