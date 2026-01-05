"""
Auth Service - Authentication and Authorization.
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional
import logging
from shared.database import get_db
from shared.utils.security import (
    verify_password, get_password_hash, create_access_token, 
    create_refresh_token, decode_token
)
from shared.utils.validation import validate_email, validate_nigerian_phone
from shared.config import get_settings
from shared.models.user import User, KYCStatus
import uuid

settings = get_settings()
logger = logging.getLogger(__name__)
security = HTTPBearer()

app = FastAPI(
    title="Auth Service",
    description="Authentication and Authorization Service",
    version="1.0.0"
)


# Pydantic models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    phone: str
    first_name: str
    last_name: str
    country_code: str = "NG"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    phone: str
    first_name: str
    last_name: str
    kyc_status: str
    is_active: bool


# Database models would go here (using shared models)
# For now, placeholder structure


@app.post("/api/v1/auth/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user."""
    # Validate phone number
    if not validate_nigerian_phone(user_data.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Nigerian phone number format"
        )
    
    # Validate region
    from shared.utils.validation import validate_region
    is_valid, error = validate_region(user_data.country_code)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.phone == user_data.phone)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or phone already exists"
        )
    
    # Hash password
    password_hash = get_password_hash(user_data.password)
    
    # Create user
    new_user = User(
        id=str(uuid.uuid4()),
        email=user_data.email,
        phone=user_data.phone,
        password_hash=password_hash,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        country_code=user_data.country_code,
        kyc_status=KYCStatus.PENDING,
        is_active=True,
        is_verified=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    logger.info(f"New user registered: {new_user.email} (ID: {new_user.id})")
    
    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        phone=new_user.phone,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        kyc_status=new_user.kyc_status.value,
        is_active=new_user.is_active
    )


@app.post("/api/v1/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return tokens."""
    # Fetch user from database
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    logger.info(f"User logged in: {user.email} (ID: {user.id})")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@app.post("/api/v1/auth/refresh", response_model=TokenResponse)
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Refresh access token using refresh token."""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    email = payload.get("email", "")
    
    # Create new tokens
    access_token = create_access_token(data={"sub": user_id, "email": email})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@app.get("/api/v1/auth/me", response_model=UserResponse)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current authenticated user."""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token"
        )
    
    user_id = payload.get("sub")
    
    # Fetch user from database
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        phone=user.phone,
        first_name=user.first_name,
        last_name=user.last_name,
        kyc_status=user.kyc_status.value,
        is_active=user.is_active
    )


@app.post("/api/v1/auth/kyc/verify")
async def verify_kyc(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Initiate KYC verification process."""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    
    # TODO: Integrate with KYC provider
    # TODO: Update user KYC status
    
    return {"status": "kyc_initiated", "message": "KYC verification process started"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "auth"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.auth_service_port,
        reload=settings.debug
    )

