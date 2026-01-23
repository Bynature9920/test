"""
Bill payment models for BenGo.
"""
from sqlalchemy import Column, String, Numeric, Boolean, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from .base import BaseModel


class BillProvider(BaseModel):
    """Bill provider model - represents service providers (MTN, DSTV, etc)."""
    
    __tablename__ = "bill_providers"
    
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # airtime, data, tv, electricity
    api_code = Column(String(50), nullable=False, unique=True)
    is_active = Column(Boolean, default=True, nullable=False)
    extra_data = Column(JSON, nullable=True)  # Additional provider info
    
    # Indexes
    __table_args__ = (
        Index('idx_bill_provider_category', 'category'),
        Index('idx_bill_provider_active', 'is_active'),
    )


class Bill(BaseModel):
    """Bill model - represents a bill payment transaction."""
    
    __tablename__ = "bills"
    
    user_id = Column(String(20), ForeignKey("users.id"), nullable=False)
    bill_type = Column(String(50), nullable=False)  # airtime, data, tv, electricity
    provider_code = Column(String(50), nullable=False)
    provider_name = Column(String(100), nullable=False)
    
    # Transaction details
    reference = Column(String(100), unique=True, nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    phone_number = Column(String(20), nullable=True)  # For airtime/data
    account_number = Column(String(100), nullable=True)  # For TV, electricity
    
    # Status tracking
    status = Column(String(50), default="pending", nullable=False)  # pending, success, failed, reversed
    
    # Provider response
    provider_reference = Column(String(100), nullable=True)
    extra_data = Column(JSON, nullable=True)  # Store provider response and other details
    
    # Relationships
    user = relationship("User", back_populates="bills")
    transactions = relationship("BillTransaction", back_populates="bill", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_bill_user', 'user_id'),
        Index('idx_bill_type', 'bill_type'),
        Index('idx_bill_status', 'status'),
        Index('idx_bill_reference', 'reference'),
    )


class BillTransaction(BaseModel):
    """Bill transaction model - links bill to wallet transaction."""
    
    __tablename__ = "bill_transactions"
    
    bill_id = Column(String(20), ForeignKey("bills.id"), nullable=False)
    wallet_transaction_id = Column(String(20), nullable=True)  # Link to wallet debit
    
    # Provider details
    provider_response = Column(JSON, nullable=True)
    status = Column(String(50), default="pending", nullable=False)
    
    # Relationships
    bill = relationship("Bill", back_populates="transactions")
    
    # Indexes
    __table_args__ = (
        Index('idx_bill_transaction_bill', 'bill_id'),
        Index('idx_bill_transaction_status', 'status'),
    )
