"""
Payments Service - Payment Processing.
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Optional
from enum import Enum
import logging
from shared.database import get_db
from shared.utils.security import decode_token
from shared.utils.validation import validate_amount, validate_nigerian_bank_account
from shared.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)
security = HTTPBearer()

app = FastAPI(
    title="Payments Service",
    description="Payment Processing Service",
    version="1.0.0"
)


class PaymentType(str, Enum):
    P2P = "P2P"
    BANK_TRANSFER = "BANK_TRANSFER"
    TUITION = "TUITION"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


# Pydantic models
class P2PTransferRequest(BaseModel):
    recipient_id: str
    amount: Decimal
    currency: str = "NGN"
    description: Optional[str] = None


class BankTransferRequest(BaseModel):
    account_number: str
    bank_code: str
    account_name: str
    amount: Decimal
    currency: str = "NGN"
    description: Optional[str] = None
    narration: Optional[str] = None


class TuitionPaymentRequest(BaseModel):
    institution_id: str
    student_id: str
    amount: Decimal
    currency: str = "NGN"
    description: Optional[str] = None


class PaymentResponse(BaseModel):
    payment_id: str
    status: PaymentStatus
    amount: Decimal
    currency: str
    fee: Decimal
    net_amount: Decimal


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


@app.post("/api/v1/payments/p2p", response_model=PaymentResponse)
async def p2p_transfer(
    transfer: P2PTransferRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Send money to another user (P2P)."""
    # Validate amount
    is_valid, error = validate_amount(float(transfer.amount))
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    # TODO: Check user balance
    # TODO: Deduct from sender wallet
    # TODO: Add to recipient wallet
    # TODO: Create ledger entries
    # TODO: Record transaction
    
    fee = Decimal("0.00")  # Calculate fee
    
    return PaymentResponse(
        payment_id="payment_id_placeholder",
        status=PaymentStatus.PROCESSING,
        amount=transfer.amount,
        currency=transfer.currency,
        fee=fee,
        net_amount=transfer.amount - fee
    )


@app.post("/api/v1/payments/bank-transfer", response_model=PaymentResponse)
async def bank_transfer(
    transfer: BankTransferRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Transfer money to a Nigerian bank account."""
    # Validate amount
    is_valid, error = validate_amount(float(transfer.amount))
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    # Validate account number
    if not validate_nigerian_bank_account(transfer.account_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid bank account number"
        )
    
    # TODO: Check user balance
    # TODO: Deduct from wallet
    # TODO: Integrate with bank API
    # TODO: Create ledger entries
    # TODO: Record transaction
    
    fee = Decimal("50.00")  # Bank transfer fee
    
    return PaymentResponse(
        payment_id="payment_id_placeholder",
        status=PaymentStatus.PROCESSING,
        amount=transfer.amount,
        currency=transfer.currency,
        fee=fee,
        net_amount=transfer.amount - fee
    )


@app.post("/api/v1/payments/tuition", response_model=PaymentResponse)
async def pay_tuition(
    payment: TuitionPaymentRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Pay tuition or school fees."""
    # Validate amount
    is_valid, error = validate_amount(float(payment.amount))
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    # TODO: Check user balance
    # TODO: Deduct from wallet
    # TODO: Integrate with institution payment system
    # TODO: Create ledger entries
    # TODO: Record transaction
    
    fee = Decimal("0.00")  # Tuition payment fee
    
    return PaymentResponse(
        payment_id="payment_id_placeholder",
        status=PaymentStatus.PROCESSING,
        amount=payment.amount,
        currency=payment.currency,
        fee=fee,
        net_amount=payment.amount - fee
    )


@app.get("/api/v1/payments/{payment_id}")
async def get_payment(
    payment_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get payment details."""
    # TODO: Fetch payment from database
    return {
        "payment_id": payment_id,
        "status": "COMPLETED",
        "amount": "1000.00",
        "currency": "NGN"
    }


@app.get("/api/v1/payments")
async def get_payments(
    page: int = 1,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get payment history."""
    # TODO: Fetch payments from database
    return {
        "payments": [],
        "page": page,
        "limit": limit,
        "total": 0
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "payments"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.payments_service_port,
        reload=settings.debug
    )

