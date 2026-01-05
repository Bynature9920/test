"""
Card models.
"""
from sqlalchemy import Column, String, Numeric, ForeignKey, Enum as SQLEnum, Integer
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class CardType(str, enum.Enum):
    VIRTUAL = "VIRTUAL"
    PHYSICAL = "PHYSICAL"


class CardStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    BLOCKED = "BLOCKED"
    EXPIRED = "EXPIRED"


class Card(BaseModel):
    """Virtual debit card model."""
    __tablename__ = "cards"
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    card_number = Column(String(16), nullable=False, unique=True, index=True)
    cardholder_name = Column(String(100), nullable=False)
    expiry_month = Column(Integer, nullable=False)
    expiry_year = Column(Integer, nullable=False)
    cvv_hash = Column(String(255), nullable=False)
    card_type = Column(SQLEnum(CardType), nullable=False, default=CardType.VIRTUAL)
    status = Column(SQLEnum(CardStatus), nullable=False, default=CardStatus.ACTIVE)
    currency = Column(String(3), nullable=False, default="NGN")
    balance = Column(Numeric(20, 2), nullable=False, default=0.00)
    provider_card_id = Column(String(100), nullable=True)  # External provider ID
    
    # Relationships
    transactions = relationship("CardTransaction", back_populates="card", lazy="dynamic")


class CardTransaction(BaseModel):
    """Card transaction model."""
    __tablename__ = "card_transactions"
    
    card_id = Column(String(36), ForeignKey("cards.id"), nullable=False, index=True)
    transaction_type = Column(String(20), nullable=False)  # FUND, PAYMENT, REFUND
    amount = Column(Numeric(20, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="NGN")
    merchant_name = Column(String(255), nullable=True)
    merchant_category = Column(String(50), nullable=True)
    description = Column(String(500), nullable=True)
    reference = Column(String(100), nullable=True, index=True)
    
    # Relationships
    card = relationship("Card", back_populates="transactions")

