"""
Crypto models.
"""
from sqlalchemy import Column, String, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class CryptoCurrency(str, enum.Enum):
    BTC = "BTC"
    USDT = "USDT"
    ETH = "ETH"


class CryptoTransactionStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMING = "CONFIRMING"
    CONFIRMED = "CONFIRMED"
    FAILED = "FAILED"


class CryptoBalance(BaseModel):
    """Crypto balance model."""
    __tablename__ = "crypto_balances"
    
    user_id = Column(String(20), ForeignKey("users.id"), nullable=False, index=True)
    currency = Column(SQLEnum(CryptoCurrency), nullable=False)
    balance = Column(Numeric(20, 8), nullable=False, default=0.00000000)
    ngn_value = Column(Numeric(20, 2), nullable=False, default=0.00)
    
    # Relationships
    transactions = relationship("CryptoTransaction", back_populates="crypto_balance", lazy="dynamic")


class CryptoTransaction(BaseModel):
    """Crypto transaction model."""
    __tablename__ = "crypto_transactions"
    
    user_id = Column(String(20), ForeignKey("users.id"), nullable=False, index=True)
    crypto_balance_id = Column(String(20), ForeignKey("crypto_balances.id"), nullable=True)
    transaction_type = Column(String(20), nullable=False)  # FUND, CONVERT, WITHDRAW
    currency = Column(SQLEnum(CryptoCurrency), nullable=False)
    amount = Column(Numeric(20, 8), nullable=False)
    ngn_amount = Column(Numeric(20, 2), nullable=True)
    exchange_rate = Column(Numeric(20, 2), nullable=True)
    status = Column(SQLEnum(CryptoTransactionStatus), nullable=False, default=CryptoTransactionStatus.PENDING)
    wallet_address = Column(String(255), nullable=True)
    blockchain_tx_hash = Column(String(255), nullable=True, index=True)
    confirmations = Column(String(10), nullable=True, default="0")
    
    # Relationships
    crypto_balance = relationship("CryptoBalance", back_populates="transactions")

