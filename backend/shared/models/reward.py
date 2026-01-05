"""
Reward models.
"""
from sqlalchemy import Column, String, Numeric, ForeignKey, Enum as SQLEnum, Integer
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class RewardType(str, enum.Enum):
    CASHBACK = "CASHBACK"
    POINTS = "POINTS"


class RewardStatus(str, enum.Enum):
    PENDING = "PENDING"
    EARNED = "EARNED"
    REDEEMED = "REDEEMED"
    EXPIRED = "EXPIRED"


class Reward(BaseModel):
    """Reward model."""
    __tablename__ = "rewards"
    
    user_id = Column(String(20), ForeignKey("users.id"), nullable=False, index=True)
    reward_type = Column(SQLEnum(RewardType), nullable=False)
    amount = Column(Numeric(20, 2), nullable=True)  # For cashback
    points = Column(Integer, nullable=True)  # For points
    status = Column(SQLEnum(RewardStatus), nullable=False, default=RewardStatus.PENDING)
    transaction_id = Column(String(20), nullable=True, index=True)
    expires_at = Column(String(50), nullable=True)


class UserRewardsBalance(BaseModel):
    """User rewards balance model."""
    __tablename__ = "user_rewards_balances"
    
    user_id = Column(String(20), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    cashback_balance = Column(Numeric(20, 2), nullable=False, default=0.00)
    points_balance = Column(Integer, nullable=False, default=0)
    total_cashback_earned = Column(Numeric(20, 2), nullable=False, default=0.00)
    total_points_earned = Column(Integer, nullable=False, default=0)
    tier = Column(String(20), nullable=False, default="Bronze")  # Bronze, Silver, Gold

