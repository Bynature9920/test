"""
Cards Service - Virtual Debit Card Management.
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Optional
from enum import Enum
from datetime import datetime
import logging
from shared.database import get_db
from shared.utils.security import decode_token
from shared.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)
security = HTTPBearer()

app = FastAPI(
    title="Cards Service",
    description="Virtual Debit Card Management Service",
    version="1.0.0"
)


class CardStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    BLOCKED = "BLOCKED"
    EXPIRED = "EXPIRED"


class CardType(str, Enum):
    VIRTUAL = "VIRTUAL"
    PHYSICAL = "PHYSICAL"


# Pydantic models
class CardResponse(BaseModel):
    card_id: str
    card_number: str  # Masked
    cardholder_name: str
    expiry_month: int
    expiry_year: int
    cvv: Optional[str] = None  # Only for creation
    card_type: CardType
    status: CardStatus
    currency: str
    balance: Decimal


class CreateCardRequest(BaseModel):
    card_type: CardType = CardType.VIRTUAL
    currency: str = "NGN"
    cardholder_name: Optional[str] = None


class FundCardRequest(BaseModel):
    card_id: str
    amount: Decimal
    currency: str = "NGN"


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


@app.post("/api/v1/cards/create", response_model=CardResponse)
async def create_card(
    request: CreateCardRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new virtual debit card."""
    # TODO: Integrate with card provider API
    # TODO: Generate card details
    # TODO: Create card record in database
    # TODO: Link to user wallet
    
    return CardResponse(
        card_id="card_id_placeholder",
        card_number="**** **** **** 1234",  # Masked
        cardholder_name=request.cardholder_name or "User Name",
        expiry_month=12,
        expiry_year=2025,
        cvv="123",  # Only shown once
        card_type=request.card_type,
        status=CardStatus.ACTIVE,
        currency=request.currency,
        balance=Decimal("0.00")
    )


@app.get("/api/v1/cards", response_model=list[CardResponse])
async def get_cards(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all user cards."""
    # TODO: Fetch cards from database
    return []


@app.get("/api/v1/cards/{card_id}", response_model=CardResponse)
async def get_card(
    card_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get card details."""
    # TODO: Fetch card from database
    # TODO: Verify ownership
    return CardResponse(
        card_id=card_id,
        card_number="**** **** **** 1234",
        cardholder_name="User Name",
        expiry_month=12,
        expiry_year=2025,
        card_type=CardType.VIRTUAL,
        status=CardStatus.ACTIVE,
        currency="NGN",
        balance=Decimal("0.00")
    )


@app.post("/api/v1/cards/{card_id}/fund")
async def fund_card(
    card_id: str,
    request: FundCardRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Fund a card from wallet."""
    # TODO: Check wallet balance
    # TODO: Deduct from wallet
    # TODO: Add to card balance
    # TODO: Create ledger entries
    
    return {
        "card_id": card_id,
        "amount": str(request.amount),
        "status": "completed",
        "new_balance": "1000.00"
    }


@app.post("/api/v1/cards/{card_id}/block")
async def block_card(
    card_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Block a card."""
    # TODO: Update card status
    # TODO: Notify card provider
    
    return {
        "card_id": card_id,
        "status": "blocked",
        "message": "Card blocked successfully"
    }


@app.post("/api/v1/cards/{card_id}/unblock")
async def unblock_card(
    card_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Unblock a card."""
    # TODO: Update card status
    # TODO: Notify card provider
    
    return {
        "card_id": card_id,
        "status": "active",
        "message": "Card unblocked successfully"
    }


@app.get("/api/v1/cards/{card_id}/transactions")
async def get_card_transactions(
    card_id: str,
    page: int = 1,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get card transaction history."""
    # TODO: Fetch transactions from database
    return {
        "transactions": [],
        "page": page,
        "limit": limit,
        "total": 0
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "cards"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.cards_service_port,
        reload=settings.debug
    )

