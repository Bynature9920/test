"""
Loan models.
"""
from sqlalchemy import Column, String, Numeric, ForeignKey, Enum as SQLEnum, Date
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum
from datetime import datetime


class LoanStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ACTIVE = "ACTIVE"
    REPAID = "REPAID"
    DEFAULTED = "DEFAULTED"


class Loan(BaseModel):
    """Loan model."""
    __tablename__ = "loans"
    
    user_id = Column(String(20), ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Numeric(20, 2), nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=False)
    total_amount = Column(Numeric(20, 2), nullable=False)
    amount_paid = Column(Numeric(20, 2), nullable=False, default=0.00)
    status = Column(SQLEnum(LoanStatus), nullable=False, default=LoanStatus.PENDING)
    purpose = Column(String(500), nullable=True)
    repayment_period_days = Column(String(10), nullable=False, default="30")
    due_date = Column(Date, nullable=True)
    approved_at = Column(String(50), nullable=True)
    disbursed_at = Column(String(50), nullable=True)
    credit_score = Column(String(10), nullable=True)
    
    # Relationships
    repayments = relationship("LoanRepayment", back_populates="loan", lazy="dynamic")


class LoanRepayment(BaseModel):
    """Loan repayment model."""
    __tablename__ = "loan_repayments"
    
    loan_id = Column(String(20), ForeignKey("loans.id"), nullable=False, index=True)
    amount = Column(Numeric(20, 2), nullable=False)
    payment_method = Column(String(50), nullable=False)  # WALLET, BANK_TRANSFER
    transaction_id = Column(String(20), nullable=True, index=True)
    
    # Relationships
    loan = relationship("Loan", back_populates="repayments")

