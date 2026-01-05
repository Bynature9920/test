"""
Travel booking models.
"""
from sqlalchemy import Column, String, Numeric, ForeignKey, Enum as SQLEnum, Date, Text
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class BookingType(str, enum.Enum):
    FLIGHT = "FLIGHT"
    HOTEL = "HOTEL"


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    REFUNDED = "REFUNDED"


class TravelBooking(BaseModel):
    """Travel booking model."""
    __tablename__ = "travel_bookings"
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    booking_type = Column(SQLEnum(BookingType), nullable=False)
    status = Column(SQLEnum(BookingStatus), nullable=False, default=BookingStatus.PENDING)
    amount = Column(Numeric(20, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="NGN")
    provider_booking_id = Column(String(100), nullable=True)  # External provider ID
    booking_reference = Column(String(50), nullable=True, unique=True, index=True)
    booking_details = Column(Text, nullable=True)  # JSON string
    travel_date = Column(Date, nullable=True)
    return_date = Column(Date, nullable=True)
    location = Column(String(255), nullable=True)
    transaction_id = Column(String(36), nullable=True, index=True)

