"""
Risk and Fraud Detection models.
"""
from sqlalchemy import Column, String, Text, Numeric, Enum as SQLEnum
from .base import BaseModel
import enum


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertStatus(str, enum.Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"


class RiskAlert(BaseModel):
    """Risk and fraud alert model."""
    __tablename__ = "risk_alerts"
    
    user_id = Column(String(20), nullable=True, index=True)
    alert_type = Column(String(100), nullable=False)  # SUSPICIOUS_LOGIN, LARGE_TRANSACTION, etc.
    risk_level = Column(SQLEnum(RiskLevel), nullable=False, default=RiskLevel.LOW)
    status = Column(SQLEnum(AlertStatus), nullable=False, default=AlertStatus.OPEN)
    description = Column(Text, nullable=False)
    alert_metadata = Column(Text, nullable=True)  # JSON string with additional details
    amount = Column(Numeric(20, 2), nullable=True)  # If related to transaction
    ip_address = Column(String(50), nullable=True)
    device_id = Column(String(255), nullable=True)
    resolved_by = Column(String(20), nullable=True)  # Admin ID who resolved
    resolved_at = Column(String(50), nullable=True)  # Timestamp when resolved
    notes = Column(Text, nullable=True)  # Admin notes

