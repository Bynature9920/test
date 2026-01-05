"""
Travel Service - Flight and Hotel Bookings.
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Optional
from enum import Enum
from datetime import datetime, date
import logging
from shared.database import get_db
from shared.utils.security import decode_token
from shared.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)
security = HTTPBearer()

app = FastAPI(
    title="Travel Service",
    description="Travel Booking Service",
    version="1.0.0"
)


class BookingStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class BookingType(str, Enum):
    FLIGHT = "FLIGHT"
    HOTEL = "HOTEL"


# Pydantic models
class FlightSearchRequest(BaseModel):
    origin: str
    destination: str
    departure_date: date
    return_date: Optional[date] = None
    passengers: int = 1


class HotelSearchRequest(BaseModel):
    location: str
    check_in: date
    check_out: date
    guests: int = 1


class BookingRequest(BaseModel):
    booking_type: BookingType
    booking_reference: str
    amount: Decimal
    currency: str = "NGN"


class BookingResponse(BaseModel):
    booking_id: str
    booking_type: BookingType
    status: BookingStatus
    amount: Decimal
    currency: str
    booking_date: datetime
    details: dict


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract user ID from JWT token."""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token"
        )
    
    return payload.get("sub")


@app.get("/api/v1/travel/flights/search")
async def search_flights(
    request: FlightSearchRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Search for flights."""
    if not settings.enable_travel:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Travel features are disabled"
        )
    
    # TODO: Integrate with travel API
    # TODO: Search flights
    # TODO: Return results
    
    return {
        "flights": [],
        "total_results": 0
    }


@app.get("/api/v1/travel/hotels/search")
async def search_hotels(
    request: HotelSearchRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Search for hotels."""
    if not settings.enable_travel:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Travel features are disabled"
        )
    
    # TODO: Integrate with travel API
    # TODO: Search hotels
    # TODO: Return results
    
    return {
        "hotels": [],
        "total_results": 0
    }


@app.post("/api/v1/travel/book", response_model=BookingResponse)
async def create_booking(
    booking: BookingRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a travel booking."""
    if not settings.enable_travel:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Travel features are disabled"
        )
    
    # TODO: Check wallet balance or card balance
    # TODO: Process payment
    # TODO: Create booking with travel provider
    # TODO: Record transaction
    # TODO: Create ledger entries
    
    return BookingResponse(
        booking_id="booking_id_placeholder",
        booking_type=booking.booking_type,
        status=BookingStatus.CONFIRMED,
        amount=booking.amount,
        currency=booking.currency,
        booking_date=datetime.utcnow(),
        details={}
    )


@app.get("/api/v1/travel/bookings", response_model=list[BookingResponse])
async def get_bookings(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get user's travel bookings."""
    # TODO: Fetch bookings from database
    return []


@app.get("/api/v1/travel/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get booking details."""
    # TODO: Fetch booking from database
    # TODO: Verify ownership
    return BookingResponse(
        booking_id=booking_id,
        booking_type=BookingType.FLIGHT,
        status=BookingStatus.CONFIRMED,
        amount=Decimal("50000.00"),
        currency="NGN",
        booking_date=datetime.utcnow(),
        details={}
    )


@app.post("/api/v1/travel/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Cancel a booking."""
    # TODO: Cancel booking with provider
    # TODO: Process refund if applicable
    # TODO: Update booking status
    
    return {
        "booking_id": booking_id,
        "status": "cancelled",
        "refund_amount": "0.00",
        "message": "Booking cancelled successfully"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "travel"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.travel_service_port,
        reload=settings.debug
    )

