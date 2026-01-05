"""
Loans Service - Micro-loan Management.
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
from shared.utils.validation import validate_amount
from shared.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)
security = HTTPBearer()

app = FastAPI(
    title="Loans Service",
    description="Micro-loan Management Service",
    version="1.0.0"
)


class LoanStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ACTIVE = "ACTIVE"
    REPAID = "REPAID"
    DEFAULTED = "DEFAULTED"


class LoanApplicationRequest(BaseModel):
    amount: Decimal
    purpose: Optional[str] = None
    repayment_period_days: int = 30


class LoanResponse(BaseModel):
    loan_id: str
    user_id: str
    amount: Decimal
    interest_rate: Decimal
    total_amount: Decimal
    status: LoanStatus
    application_date: datetime
    due_date: Optional[datetime] = None


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


@app.post("/api/v1/loans/apply", response_model=LoanResponse)
async def apply_for_loan(
    application: LoanApplicationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Apply for a micro-loan."""
    if not settings.enable_loans:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Loan features are disabled"
        )
    
    # Validate amount
    if float(application.amount) > settings.max_loan_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loan amount cannot exceed ₦{settings.max_loan_amount}"
        )
    
    # TODO: Check user eligibility (transaction history, credit score)
    # TODO: Calculate interest rate based on user profile
    # TODO: Create loan application
    # TODO: Run risk assessment
    # TODO: Auto-approve or send for review
    
    interest_rate = Decimal("5.0")  # 5% interest
    total_amount = application.amount * (1 + interest_rate / 100)
    
    return LoanResponse(
        loan_id="loan_id_placeholder",
        user_id=user_id,
        amount=application.amount,
        interest_rate=interest_rate,
        total_amount=total_amount,
        status=LoanStatus.PENDING,
        application_date=datetime.utcnow(),
        due_date=None
    )


@app.get("/api/v1/loans", response_model=list[LoanResponse])
async def get_loans(
    status: Optional[LoanStatus] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get user's loans."""
    # TODO: Fetch loans from database
    return []


@app.get("/api/v1/loans/{loan_id}", response_model=LoanResponse)
async def get_loan(
    loan_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get loan details."""
    # TODO: Fetch loan from database
    # TODO: Verify ownership
    return LoanResponse(
        loan_id=loan_id,
        user_id=user_id,
        amount=Decimal("10000.00"),
        interest_rate=Decimal("5.0"),
        total_amount=Decimal("10500.00"),
        status=LoanStatus.ACTIVE,
        application_date=datetime.utcnow(),
        due_date=datetime.utcnow()
    )


@app.post("/api/v1/loans/{loan_id}/repay")
async def repay_loan(
    loan_id: str,
    amount: Optional[Decimal] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Repay a loan."""
    # TODO: Fetch loan details
    # TODO: Check wallet balance
    # TODO: Process repayment
    # TODO: Update loan status
    # TODO: Create ledger entries
    
    return {
        "loan_id": loan_id,
        "amount_paid": str(amount or "0.00"),
        "status": "repaid",
        "message": "Loan repayment successful"
    }


@app.get("/api/v1/loans/eligibility")
async def check_eligibility(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Check loan eligibility and maximum amount."""
    # TODO: Calculate eligibility based on transaction history
    # TODO: Get credit score
    # TODO: Determine maximum loan amount
    
    return {
        "eligible": True,
        "max_amount": settings.max_loan_amount,
        "interest_rate": "5.0",
        "credit_score": 750
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "loans"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.loans_service_port,
        reload=settings.debug
    )

