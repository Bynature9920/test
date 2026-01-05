"""
Wallet Service - Wallet and Ledger Management.
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Optional
from datetime import datetime
import logging
from shared.database import get_db
from shared.utils.security import decode_token
from shared.utils.ledger import (
    AccountType, TransactionType, LedgerEntry, DoubleEntryTransaction
)
from shared.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)
security = HTTPBearer()

app = FastAPI(
    title="Wallet Service",
    description="Wallet and Ledger Management Service",
    version="1.0.0"
)


# Pydantic models
class WalletBalance(BaseModel):
    currency: str
    available_balance: Decimal
    pending_balance: Decimal
    total_balance: Decimal


class WalletResponse(BaseModel):
    wallet_id: str
    user_id: str
    currency: str
    balance: Decimal
    created_at: datetime


class TransactionRequest(BaseModel):
    amount: Decimal
    currency: str = "NGN"
    description: Optional[str] = None
    reference: Optional[str] = None


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


@app.get("/api/v1/wallet/balance", response_model=WalletBalance)
async def get_balance(
    currency: str = "NGN",
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get wallet balance for a currency."""
    # TODO: Fetch balance from database
    # Placeholder response
    return WalletBalance(
        currency=currency,
        available_balance=Decimal("0.00"),
        pending_balance=Decimal("0.00"),
        total_balance=Decimal("0.00")
    )


@app.get("/api/v1/wallet/balances")
async def get_all_balances(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all wallet balances for user."""
    # TODO: Fetch all balances from database
    return {
        "balances": [
            {
                "currency": "NGN",
                "available_balance": "0.00",
                "pending_balance": "0.00",
                "total_balance": "0.00"
            }
        ]
    }


@app.post("/api/v1/wallet/create")
async def create_wallet(
    currency: str = "NGN",
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new wallet for a currency."""
    # TODO: Create wallet in database
    # TODO: Initialize ledger account
    return {
        "wallet_id": "wallet_id_placeholder",
        "user_id": user_id,
        "currency": currency,
        "status": "active"
    }


@app.get("/api/v1/wallet/transactions")
async def get_transactions(
    page: int = 1,
    limit: int = 20,
    currency: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get transaction history."""
    # TODO: Fetch transactions from database
    return {
        "transactions": [],
        "page": page,
        "limit": limit,
        "total": 0
    }


@app.post("/api/v1/wallet/ledger/entry")
async def create_ledger_entry(
    transaction: TransactionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a ledger entry (internal use by other services)."""
    # This would typically be called by other services to record transactions
    # TODO: Implement double-entry accounting logic
    # TODO: Validate transaction
    # TODO: Create ledger entries
    
    return {
        "transaction_id": "txn_id_placeholder",
        "status": "recorded",
        "message": "Ledger entry created successfully"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "wallet"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.wallet_service_port,
        reload=settings.debug
    )

