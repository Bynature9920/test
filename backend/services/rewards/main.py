"""
Rewards Service - Cashback and Points System.
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
from shared.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)
security = HTTPBearer()

app = FastAPI(
    title="Rewards Service",
    description="Rewards and Cashback Service",
    version="1.0.0"
)


class RewardType(str, Enum):
    CASHBACK = "CASHBACK"
    POINTS = "POINTS"


class RewardStatus(str, Enum):
    PENDING = "PENDING"
    EARNED = "EARNED"
    REDEEMED = "REDEEMED"
    EXPIRED = "EXPIRED"


# Pydantic models
class RewardsBalance(BaseModel):
    cashback_balance: Decimal
    points_balance: int
    total_cashback_earned: Decimal
    total_points_earned: int


class RewardResponse(BaseModel):
    reward_id: str
    reward_type: RewardType
    amount: Decimal
    points: Optional[int] = None
    status: RewardStatus
    transaction_id: Optional[str] = None
    earned_at: datetime
    expires_at: Optional[datetime] = None


class RedeemRequest(BaseModel):
    reward_type: RewardType
    amount: Optional[Decimal] = None
    points: Optional[int] = None


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


@app.get("/api/v1/rewards/balance", response_model=RewardsBalance)
async def get_rewards_balance(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get user's rewards balance."""
    if not settings.enable_rewards:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Rewards features are disabled"
        )
    
    # TODO: Fetch rewards balance from database
    return RewardsBalance(
        cashback_balance=Decimal("0.00"),
        points_balance=0,
        total_cashback_earned=Decimal("0.00"),
        total_points_earned=0
    )


@app.post("/api/v1/rewards/earn")
async def earn_reward(
    transaction_id: str,
    amount: Decimal,
    reward_type: RewardType = RewardType.CASHBACK,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Earn reward from a transaction (called by other services)."""
    if not settings.enable_rewards:
        return {"status": "disabled"}
    
    # TODO: Calculate reward based on transaction amount and type
    # TODO: Create reward record
    # TODO: Update user rewards balance
    
    cashback_rate = Decimal("0.01")  # 1% cashback
    reward_amount = amount * cashback_rate
    
    return {
        "reward_id": "reward_id_placeholder",
        "reward_type": reward_type.value,
        "amount": str(reward_amount),
        "status": "earned",
        "transaction_id": transaction_id
    }


@app.post("/api/v1/rewards/redeem")
async def redeem_reward(
    request: RedeemRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Redeem cashback or points."""
    if not settings.enable_rewards:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Rewards features are disabled"
        )
    
    # TODO: Check rewards balance
    # TODO: Process redemption
    # TODO: Add to wallet if cashback
    # TODO: Update rewards balance
    
    return {
        "redemption_id": "redemption_id_placeholder",
        "reward_type": request.reward_type.value,
        "amount": str(request.amount or "0.00"),
        "status": "completed",
        "message": "Reward redeemed successfully"
    }


@app.get("/api/v1/rewards/history")
async def get_rewards_history(
    page: int = 1,
    limit: int = 20,
    reward_type: Optional[RewardType] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get rewards history."""
    # TODO: Fetch rewards from database
    return {
        "rewards": [],
        "page": page,
        "limit": limit,
        "total": 0
    }


@app.get("/api/v1/rewards/tiers")
async def get_rewards_tiers():
    """Get rewards tier information."""
    return {
        "tiers": [
            {
                "tier": "Bronze",
                "cashback_rate": "0.5%",
                "points_multiplier": 1.0,
                "min_transactions": 0
            },
            {
                "tier": "Silver",
                "cashback_rate": "1.0%",
                "points_multiplier": 1.5,
                "min_transactions": 10
            },
            {
                "tier": "Gold",
                "cashback_rate": "1.5%",
                "points_multiplier": 2.0,
                "min_transactions": 50
            }
        ]
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "rewards"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.rewards_service_port,
        reload=settings.debug
    )

