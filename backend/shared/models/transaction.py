"""
Transaction models.
"""
from sqlalchemy import Column, String, Numeric, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class TransactionType(str, enum.Enum):
    P2P = "P2P"
    BANK_TRANSFER = "BANK_TRANSFER"
    TUITION = "TUITION"
    CRYPTO_FUND = "CRYPTO_FUND"
    CRYPTO_CONVERT = "CRYPTO_CONVERT"
    CARD_PAYMENT = "CARD_PAYMENT"
    LOAN_DISBURSEMENT = "LOAN_DISBURSEMENT"
    LOAN_REPAYMENT = "LOAN_REPAYMENT"
    TRAVEL_BOOKING = "TRAVEL_BOOKING"
    REWARD_EARNED = "REWARD_EARNED"
    REWARD_REDEEMED = "REWARD_REDEEMED"


class TransactionStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REVERSED = "REVERSED"


class Transaction(BaseModel):
    """Transaction model."""
    __tablename__ = "transactions"
    
    user_id = Column(String(20), ForeignKey("users.id"), nullable=False, index=True)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    status = Column(SQLEnum(TransactionStatus), nullable=False, default=TransactionStatus.PENDING)
    amount = Column(Numeric(20, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="NGN")
    fee = Column(Numeric(20, 2), nullable=False, default=0.00)
    net_amount = Column(Numeric(20, 2), nullable=False)
    recipient_id = Column(String(20), nullable=True, index=True)
    description = Column(Text, nullable=True)
    reference = Column(String(100), nullable=True, index=True)
    transaction_metadata = Column(Text, nullable=True)  # JSON string (renamed from 'metadata' - reserved word)
    
    # Relationships
    user = relationship("User", back_populates="transactions")

