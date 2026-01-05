"""
Wallet models.
"""
from sqlalchemy import Column, String, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class WalletStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    CLOSED = "CLOSED"


class Wallet(BaseModel):
    """Wallet model."""
    __tablename__ = "wallets"
    
    user_id = Column(String(20), ForeignKey("users.id"), nullable=False, index=True)
    currency = Column(String(3), nullable=False, default="NGN")
    balance = Column(Numeric(20, 2), nullable=False, default=0.00)
    pending_balance = Column(Numeric(20, 2), nullable=False, default=0.00)
    status = Column(SQLEnum(WalletStatus), nullable=False, default=WalletStatus.ACTIVE)
    
    # Relationships
    user = relationship("User", back_populates="wallets")
    ledger_entries = relationship("LedgerEntry", back_populates="wallet", lazy="dynamic")


class LedgerEntry(BaseModel):
    """Ledger entry for double-entry accounting."""
    __tablename__ = "ledger_entries"
    
    wallet_id = Column(String(20), ForeignKey("wallets.id"), nullable=False, index=True)
    transaction_id = Column(String(20), nullable=False, index=True)
    account_type = Column(String(20), nullable=False)  # ASSET, LIABILITY, etc.
    entry_type = Column(String(10), nullable=False)  # DEBIT, CREDIT
    amount = Column(Numeric(20, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="NGN")
    description = Column(String(500), nullable=True)
    reference = Column(String(100), nullable=True)
    
    # Relationships
    wallet = relationship("Wallet", back_populates="ledger_entries")

