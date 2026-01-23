"""
API Gateway main application.
"""
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import httpx
import logging
from shared.config import get_settings
from shared.database import get_db
from shared.utils.security import (
    verify_password, get_password_hash, create_access_token, 
    create_refresh_token, decode_token
)
from shared.utils.validation import validate_nigerian_phone
from shared.models.user import User, KYCStatus
from shared.models.verification import VerificationDocument, VerificationStatus
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta, timezone
import secrets
from shared.utils.email import send_password_reset_email

settings = get_settings()
logger = logging.getLogger(__name__)
security = HTTPBearer()


# Helper function to get user ID from token
def get_current_user_id(credentials: HTTPAuthorizationCredentials) -> str:
    """Extract user ID from JWT token."""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=401,
            detail="Invalid access token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload"
        )
    
    return user_id


# Service URLs
SERVICE_URLS = {
    "auth": f"http://localhost:{settings.auth_service_port}",
    "wallet": f"http://localhost:{settings.wallet_service_port}",
    "payments": f"http://localhost:{settings.payments_service_port}",
    "cards": f"http://localhost:{settings.cards_service_port}",
    "loans": f"http://localhost:{settings.loans_service_port}",
    "crypto": f"http://localhost:{settings.crypto_service_port}",
    "travel": f"http://localhost:{settings.travel_service_port}",
    "rewards": f"http://localhost:{settings.rewards_service_port}",
    "risk": f"http://localhost:{settings.risk_service_port}",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for the application."""
    logger.info("API Gateway starting up...")
    yield
    logger.info("API Gateway shutting down...")


app = FastAPI(
    title="BenGo API Gateway",
    description="API Gateway for BenGo",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Allow all origins in development for Google OAuth
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development/Google OAuth
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


async def forward_request(service_name: str, path: str, method: str, request: Request):
    """Forward request to appropriate service."""
    if service_name not in SERVICE_URLS:
        raise HTTPException(status_code=404, detail=f"Service {service_name} not found")
    
    service_url = SERVICE_URLS[service_name]
    url = f"{service_url}{path}"
    
    # Get request body if present
    body = None
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            body = await request.body()
        except Exception:
            pass
    
    # Get headers (excluding host)
    headers = dict(request.headers)
    headers.pop("host", None)
    
    # Forward request
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=method,
                url=url,
                content=body,
                headers=headers,
                params=dict(request.query_params),
                timeout=30.0
            )
            return JSONResponse(
                content=response.json() if response.headers.get("content-type", "").startswith("application/json") else {"data": response.text},
                status_code=response.status_code,
                headers=dict(response.headers)
            )
        except httpx.RequestError as e:
            logger.error(f"Error forwarding request to {service_name}: {e}")
            raise HTTPException(status_code=503, detail=f"Service {service_name} unavailable")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "BenGo API Gateway",
        "version": "1.0.0",
        "services": list(SERVICE_URLS.keys())
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "gateway": "operational"}


# Auth Pydantic models
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

class GoogleOAuthRequest(BaseModel):
    id_token: str
    access_token: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UpdateEmailRequest(BaseModel):
    email: EmailStr
    password: str

class UpdatePhoneRequest(BaseModel):
    phone: str
    password: str

# Auth routes - Direct implementation (not proxied)
@app.post("/api/v1/auth/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        # Validate phone number (relaxed validation - just check it's not empty)
        if not user_data.phone or len(user_data.phone.strip()) < 5:
            raise HTTPException(
                status_code=400,
                detail="Phone number is required and must be at least 5 characters"
            )
        
        # Validate region
        from shared.utils.validation import validate_region
        is_valid, error = validate_region(user_data.country_code)
        if not is_valid:
            raise HTTPException(status_code=403, detail=error)
        
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.email == user_data.email) | (User.phone == user_data.phone)
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User with this email or phone already exists"
            )
        
        # Hash password
        password_hash = get_password_hash(user_data.password)
        
        # Create user (ID will be auto-generated as numeric by BaseModel)
        new_user = User(
            email=user_data.email,
            phone=user_data.phone,
            password_hash=password_hash,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            country_code=user_data.country_code,
            kyc_status=KYCStatus.NOT_STARTED,
            is_active=True,
            is_verified=False
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create default NGN wallet with ₦0.00 balance
        from shared.models.wallet import Wallet
        default_wallet = Wallet(
            user_id=new_user.id,
            currency="NGN",
            balance=0.00,
            pending_balance=0.00
        )
        db.add(default_wallet)
        db.commit()
        
        logger.info(f"✅ New user registered: {new_user.email} (ID: {new_user.id}) with NGN wallet")
        
        return UserResponse(
            id=str(new_user.id),
            email=new_user.email,
            phone=new_user.phone,
            first_name=new_user.first_name,
            last_name=new_user.last_name,
            kyc_status=new_user.kyc_status.value,
            is_active=new_user.is_active
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )

@app.post("/api/v1/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return tokens."""
    # Fetch user from database
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="No existing account for this email"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )
    
    # Update last login
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
            status_code=401,
            detail="Invalid access token"
        )
    
    user_id = payload.get("sub")
    
    # Fetch user from database
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=404,
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

@app.post("/api/v1/auth/refresh", response_model=TokenResponse)
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Refresh access token using refresh token."""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    
    # Create new tokens
    access_token = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@app.post("/api/v1/auth/google", response_model=TokenResponse)
async def google_oauth(oauth_data: GoogleOAuthRequest, db: Session = Depends(get_db)):
    """Authenticate or register user with Google OAuth."""
    try:
        # Verify Google ID token
        import httpx
        async with httpx.AsyncClient() as client:
            # Verify token with Google
            response = await client.get(
                f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={oauth_data.id_token}",
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid Google token"
                )
            
            google_user = response.json()
            
            # Extract user info
            google_id = google_user.get("sub")
            email = google_user.get("email")
            first_name = google_user.get("given_name", "")
            last_name = google_user.get("family_name", "")
            
            if not google_id or not email:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid Google token data"
                )
            
            # Check if user exists by Google ID or email
            user = db.query(User).filter(
                (User.google_id == google_id) | (User.email == email)
            ).first()
            
            if user:
                # Update Google ID if not set
                if not user.google_id:
                    user.google_id = google_id
                    user.oauth_provider = "google"
                    db.commit()
                
                # Update last login
                user.last_login = datetime.utcnow()
                db.commit()
            else:
                # Create new user (ID will be auto-generated as numeric by BaseModel)
                user = User(
                    email=email,
                    google_id=google_id,
                    oauth_provider="google",
                    first_name=first_name,
                    last_name=last_name,
                    country_code="NG",
                    kyc_status=KYCStatus.NOT_STARTED,
                    is_active=True,
                    is_verified=google_user.get("email_verified", False),
                    phone=None,  # Can be added later
                    password_hash=None  # OAuth users don't need password
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                
                # Create default NGN wallet with ₦0.00 balance
                from shared.models.wallet import Wallet
                default_wallet = Wallet(
                    user_id=user.id,
                    currency="NGN",
                    balance=0.00,
                    pending_balance=0.00
                )
                db.add(default_wallet)
                db.commit()
                
                logger.info(f"New Google user registered: {user.email} (ID: {user.id}) with NGN wallet")
            
            # Create tokens
            access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
            refresh_token = create_refresh_token(data={"sub": str(user.id)})
            
            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token
            )
            
    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Unable to verify Google token"
        )
    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"OAuth authentication failed: {str(e)}"
        )

@app.post("/api/v1/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send password reset email."""
    try:
        # Find user by email
        user = db.query(User).filter(User.email == request.email).first()
        
        # Return specific error if email doesn't exist
        if not user:
            logger.warning(f"Password reset requested for non-existent email: {request.email}")
            raise HTTPException(
                status_code=404,
                detail="No existing account for this email"
            )
        
        # Check if user has password (OAuth users can't reset password)
        if not user.password_hash:
            logger.warning(f"Password reset requested for OAuth user: {request.email}")
            raise HTTPException(
                status_code=400,
                detail="This account uses Google sign-in. Password reset is not available."
            )
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        
        # Send email
        frontend_url = getattr(settings, 'frontend_url', 'http://localhost:3000')
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        send_password_reset_email(user.email, reset_token, reset_url)
        
        logger.info(f"Password reset email sent to: {user.email}")
        
        return {"message": "If the email exists, a password reset link has been sent."}
        
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}", exc_info=True)
        return {"message": "If the email exists, a password reset link has been sent."}

@app.post("/api/v1/auth/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using token."""
    try:
        # Find user by reset token
        user = db.query(User).filter(User.reset_token == request.token).first()
        
        if not user:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset token"
            )
        
        # Check if token expired
        current_time = datetime.utcnow()
        token_expires = user.reset_token_expires
        
        # Handle timezone-aware datetime comparison
        if token_expires and hasattr(token_expires, 'tzinfo') and token_expires.tzinfo is not None:
            # If token_expires is timezone-aware, make current_time timezone-aware too
            current_time = datetime.now(timezone.utc).replace(tzinfo=None)
            token_expires = token_expires.replace(tzinfo=None)
        
        if not user.reset_token_expires or token_expires < current_time:
            # Clear expired token
            user.reset_token = None
            user.reset_token_expires = None
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="Reset token has expired"
            )
        
        # Update password
        user.password_hash = get_password_hash(request.new_password)
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        
        logger.info(f"Password reset successful for: {user.email}")
        
        return {"message": "Password has been reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to reset password"
        )

@app.post("/api/v1/auth/change-password")
async def change_password(
    request: ChangePasswordRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Change user password."""
    try:
        # Decode token to get user ID
        token_data = decode_token(credentials.credentials)
        if not token_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = token_data.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user or not user.password_hash:
            raise HTTPException(status_code=404, detail="User not found or OAuth user")
        
        # Verify current password
        if not verify_password(request.current_password, user.password_hash):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Update password
        user.password_hash = get_password_hash(request.new_password)
        db.commit()
        
        logger.info(f"Password changed successfully for: {user.email}")
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Change password error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to change password")

@app.post("/api/v1/auth/update-email")
async def update_email(
    request: UpdateEmailRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Update user email."""
    try:
        # Decode token to get user ID
        token_data = decode_token(credentials.credentials)
        if not token_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = token_data.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user or not user.password_hash:
            raise HTTPException(status_code=404, detail="User not found or OAuth user")
        
        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Password is incorrect")
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user and existing_user.id != user_id:
            raise HTTPException(status_code=400, detail="Email already in use")
        
        # Update email
        user.email = request.email
        user.is_verified = False  # Require re-verification
        db.commit()
        
        logger.info(f"Email updated for user {user_id}: {request.email}")
        return {"message": "Email updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update email error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update email")

@app.post("/api/v1/auth/update-phone")
async def update_phone(
    request: UpdatePhoneRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Update user phone number."""
    try:
        # Decode token to get user ID
        token_data = decode_token(credentials.credentials)
        if not token_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = token_data.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user or not user.password_hash:
            raise HTTPException(status_code=404, detail="User not found or OAuth user")
        
        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Password is incorrect")
        
        # Check if phone already exists
        existing_user = db.query(User).filter(User.phone == request.phone).first()
        if existing_user and existing_user.id != user_id:
            raise HTTPException(status_code=400, detail="Phone number already in use")
        
        # Update phone
        user.phone = request.phone
        db.commit()
        
        logger.info(f"Phone updated for user {user_id}: {request.phone}")
        return {"message": "Phone number updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update phone error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update phone number")


# ========== Verification Endpoints ==========

class VerificationDocumentUpload(BaseModel):
    country_code: str
    document_type: str  # passport, drivers_license, voters_card, nin
    document_side: Optional[str] = None  # front, back (for driver's license)
    file_data: str  # Base64 encoded image

class VerificationSubmitRequest(BaseModel):
    country_code: str
    documents: list[VerificationDocumentUpload]

@app.post("/api/v1/verification/submit")
async def submit_verification(
    request: VerificationSubmitRequest,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Submit verification documents."""
    try:
        current_user_id = get_current_user_id(credentials)
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if already verified
        if user.kyc_status == KYCStatus.VERIFIED:
            raise HTTPException(status_code=400, detail="Account is already verified")
        
        # Validate at least one document
        if not request.documents:
            raise HTTPException(status_code=400, detail="At least one document is required")
        
        # Store documents
        for doc in request.documents:
            # In production, upload to cloud storage (S3, etc.) and get URL
            # For now, we'll store the base64 data directly (not recommended for production)
            file_url = f"data:image/png;base64,{doc.file_data[:50]}..."  # Truncate for demo
            
            verification_doc = VerificationDocument(
                user_id=str(user.id),
                country_code=request.country_code,
                document_type=doc.document_type,
                document_side=doc.document_side,
                file_url=file_url,
                status=VerificationStatus.PENDING,
                submitted_at=datetime.utcnow()
            )
            db.add(verification_doc)
        
        # Update user KYC status to pending
        user.kyc_status = KYCStatus.PENDING
        
        db.commit()
        logger.info(f"Verification documents submitted for user: {user.email} (ID: {user.id})")
        
        return {
            "message": "Verification documents submitted successfully",
            "status": "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verification submission error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to submit verification documents"
        )

@app.get("/api/v1/verification/status")
async def get_verification_status(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get verification status and documents."""
    try:
        current_user_id = get_current_user_id(credentials)
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get verification documents
        documents = db.query(VerificationDocument).filter(
            VerificationDocument.user_id == str(user.id)
        ).all()
        
        return {
            "status": user.kyc_status.value,
            "documents": [
                {
                    "id": str(doc.id),
                    "document_type": doc.document_type,
                    "document_side": doc.document_side,
                    "status": doc.status.value,
                    "submitted_at": doc.submitted_at.isoformat() if doc.submitted_at else None,
                    "reviewed_at": doc.reviewed_at.isoformat() if doc.reviewed_at else None,
                    "rejection_reason": doc.rejection_reason
                }
                for doc in documents
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get verification status error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to get verification status"
        )


# Admin routes
@app.get("/api/v1/admin/users")
async def get_all_users(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get all users (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Simple admin check - you can add a proper admin role field later
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Get all users
        users = db.query(User).order_by(User.created_at.desc()).all()
        
        return {
            "users": [
                {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "phone": user.phone or "",
                    "country_code": user.country_code or "",
                    "kyc_status": user.kyc_status.value,
                    "is_active": user.is_active,
                    "is_verified": user.is_verified,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "oauth_provider": user.oauth_provider or ""
                }
                for user in users
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get all users error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to get users"
        )


@app.post("/api/v1/admin/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Suspend a user account (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="Current user not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Find target user
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Suspend user
        target_user.is_active = False
        
        # Create audit log
        create_audit_log(
            db, 
            str(current_user_id), 
            current_user.email, 
            "SUSPEND_USER", 
            "user", 
            user_id,
            f"Suspended user {target_user.email}"
        )
        
        db.commit()
        
        logger.info(f"Admin {current_user.email} suspended user {user_id}")
        
        return {"message": "User suspended successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Suspend user error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to suspend user")


@app.post("/api/v1/admin/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Activate a suspended user account (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="Current user not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Find target user
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Activate user
        target_user.is_active = True
        
        # Create audit log
        create_audit_log(
            db, 
            str(current_user_id), 
            current_user.email, 
            "ACTIVATE_USER", 
            "user", 
            user_id,
            f"Activated user {target_user.email}"
        )
        
        db.commit()
        
        logger.info(f"Admin {current_user.email} activated user {user_id}")
        
        return {"message": "User activated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Activate user error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to activate user")


@app.post("/api/v1/admin/wallets/freeze/{user_id}")
async def freeze_user_wallets(
    user_id: str,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Freeze all wallets for a user (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="Current user not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Find target user
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Freeze all user wallets
        from shared.models.wallet import Wallet
        wallets = db.query(Wallet).filter(Wallet.user_id == user_id).all()
        
        if not wallets:
            raise HTTPException(status_code=404, detail="No wallets found for this user")
        
        for wallet in wallets:
            wallet.is_locked = True
        
        # Create audit log
        create_audit_log(
            db, 
            str(current_user_id), 
            current_user.email, 
            "FREEZE_WALLETS", 
            "user", 
            user_id,
            f"Froze {len(wallets)} wallet(s) for user {target_user.email}"
        )
        
        db.commit()
        
        logger.info(f"Admin {current_user.email} froze {len(wallets)} wallet(s) for user {user_id}")
        
        return {"message": f"Successfully froze {len(wallets)} wallet(s)"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Freeze wallets error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to freeze wallets")


@app.post("/api/v1/admin/wallets/unfreeze/{user_id}")
async def unfreeze_user_wallets(
    user_id: str,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Unfreeze all wallets for a user (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="Current user not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Find target user
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Unfreeze all user wallets
        from shared.models.wallet import Wallet
        wallets = db.query(Wallet).filter(Wallet.user_id == user_id).all()
        
        if not wallets:
            raise HTTPException(status_code=404, detail="No wallets found for this user")
        
        for wallet in wallets:
            wallet.is_locked = False
        
        # Create audit log
        create_audit_log(
            db, 
            str(current_user_id), 
            current_user.email, 
            "UNFREEZE_WALLETS", 
            "user", 
            user_id,
            f"Unfroze {len(wallets)} wallet(s) for user {target_user.email}"
        )
        
        db.commit()
        
        logger.info(f"Admin {current_user.email} unfroze {len(wallets)} wallet(s) for user {user_id}")
        
        return {"message": f"Successfully unfroze {len(wallets)} wallet(s)"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unfreeze wallets error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to unfreeze wallets")


@app.get("/api/v1/admin/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get platform statistics (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Calculate stats
        from shared.models.transaction import Transaction
        from shared.models.wallet import Wallet
        
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        # Only count users who have submitted documents (PENDING or IN_PROGRESS)
        pending_kyc = db.query(User).filter(
            (User.kyc_status == KYCStatus.PENDING) | 
            (User.kyc_status == KYCStatus.IN_PROGRESS)
        ).count()
        not_started_kyc = db.query(User).filter(User.kyc_status == KYCStatus.NOT_STARTED).count()
        
        total_transactions = db.query(Transaction).count()
        
        # Calculate total volume (sum of all transaction amounts)
        total_volume_result = db.query(Transaction).filter(
            Transaction.status == 'COMPLETED'
        ).all()
        total_volume = sum(float(t.amount) for t in total_volume_result if t.amount)
        
        # Pending and failed transactions
        pending_transactions = db.query(Transaction).filter(
            Transaction.status == 'PENDING'
        ).count()
        failed_transactions = db.query(Transaction).filter(
            Transaction.status == 'FAILED'
        ).count()
        
        # Platform revenue (sum of all transaction fees)
        platform_revenue = sum(float(t.fee or 0) for t in total_volume_result)
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "pending_kyc": pending_kyc,
            "not_started_kyc": not_started_kyc,
            "total_transactions": total_transactions,
            "total_volume": total_volume,
            "pending_transactions": pending_transactions,
            "failed_transactions": failed_transactions,
            "platform_revenue": platform_revenue
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get admin stats error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get statistics")


@app.get("/api/v1/admin/kyc/pending")
async def get_pending_kyc(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get all pending KYC verifications (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Get pending verifications
        pending_verifications = db.query(VerificationDocument).filter(
            VerificationDocument.status == VerificationStatus.PENDING
        ).order_by(VerificationDocument.submitted_at.desc()).all()
        
        result = []
        for doc in pending_verifications:
            user = db.query(User).filter(User.id == doc.user_id).first()
            if user:
                result.append({
                    "document_id": str(doc.id),
                    "user_id": str(user.id),
                    "user_name": f"{user.first_name} {user.last_name}",
                    "user_email": user.email,
                    "document_type": doc.document_type,
                    "document_side": doc.document_side,
                    "file_url": doc.file_url,
                    "country": doc.country,
                    "submitted_at": doc.submitted_at.isoformat() if doc.submitted_at else None,
                    "status": doc.status.value
                })
        
        return {"pending_verifications": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get pending KYC error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get pending verifications")


@app.post("/api/v1/admin/kyc/{document_id}/approve")
async def approve_kyc(
    document_id: str,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Approve a KYC document (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Find document
        document = db.query(VerificationDocument).filter(
            VerificationDocument.id == document_id
        ).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Approve document
        document.status = VerificationStatus.APPROVED
        document.reviewed_at = datetime.utcnow()
        document.reviewed_by = str(current_user_id)
        
        # Update user KYC status
        user = db.query(User).filter(User.id == document.user_id).first()
        if user:
            # Check if all documents are approved
            user_docs = db.query(VerificationDocument).filter(
                VerificationDocument.user_id == document.user_id
            ).all()
            
            all_approved = all(doc.status == VerificationStatus.APPROVED for doc in user_docs)
            if all_approved and len(user_docs) > 0:
                user.kyc_status = KYCStatus.VERIFIED
                user.is_verified = True
            else:
                user.kyc_status = KYCStatus.IN_PROGRESS
        
        # Create audit log
        create_audit_log(
            db, 
            str(current_user_id), 
            current_user.email, 
            "APPROVE_KYC", 
            "kyc_document", 
            document_id,
            f"Approved {document.document_type} for user {document.user_id}"
        )
        
        db.commit()
        
        logger.info(f"Admin {current_user.email} approved KYC document {document_id} for user {document.user_id}")
        
        return {"message": "KYC document approved successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Approve KYC error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to approve KYC document")


class RejectKYCRequest(BaseModel):
    reason: str


@app.post("/api/v1/admin/kyc/{document_id}/reject")
async def reject_kyc(
    document_id: str,
    request: RejectKYCRequest,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Reject a KYC document (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Find document
        document = db.query(VerificationDocument).filter(
            VerificationDocument.id == document_id
        ).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Reject document
        document.status = VerificationStatus.REJECTED
        document.reviewed_at = datetime.utcnow()
        document.reviewed_by = str(current_user_id)
        document.rejection_reason = request.reason
        
        # Update user KYC status
        user = db.query(User).filter(User.id == document.user_id).first()
        if user:
            user.kyc_status = KYCStatus.REJECTED
        
        # Create audit log
        create_audit_log(
            db, 
            str(current_user_id), 
            current_user.email, 
            "REJECT_KYC", 
            "kyc_document", 
            document_id,
            f"Rejected {document.document_type} for user {document.user_id}. Reason: {request.reason}"
        )
        
        db.commit()
        
        logger.info(f"Admin {current_user.email} rejected KYC document {document_id} for user {document.user_id}")
        
        return {"message": "KYC document rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reject KYC error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to reject KYC document")


@app.get("/api/v1/admin/wallets")
async def get_all_wallets(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get all wallets (admin only, read-only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Get all wallets
        from shared.models.wallet import Wallet
        wallets = db.query(Wallet).order_by(Wallet.created_at.desc()).all()
        
        result = []
        for wallet in wallets:
            user = db.query(User).filter(User.id == wallet.user_id).first()
            if user:
                result.append({
                    "wallet_id": str(wallet.id),
                    "user_id": str(user.id),
                    "user_name": f"{user.first_name} {user.last_name}",
                    "user_email": user.email,
                    "currency": wallet.currency,
                    "balance": str(wallet.balance),
                    "status": wallet.status,
                    "is_locked": wallet.is_locked,
                    "created_at": wallet.created_at.isoformat() if wallet.created_at else None
                })
        
        return {"wallets": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get all wallets error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get wallets")


@app.get("/api/v1/admin/transactions")
async def get_all_transactions(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    limit: int = 100
):
    """Get all transactions (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Get all transactions
        from shared.models.transaction import Transaction
        transactions = db.query(Transaction).order_by(
            Transaction.created_at.desc()
        ).limit(limit).all()
        
        result = []
        for txn in transactions:
            sender = db.query(User).filter(User.id == txn.user_id).first() if txn.user_id else None
            recipient = db.query(User).filter(User.id == txn.recipient_id).first() if txn.recipient_id else None
            
            result.append({
                "transaction_id": str(txn.id),
                "sender_id": str(txn.user_id) if txn.user_id else None,
                "sender_name": f"{sender.first_name} {sender.last_name}" if sender else None,
                "recipient_id": str(txn.recipient_id) if txn.recipient_id else None,
                "recipient_name": f"{recipient.first_name} {recipient.last_name}" if recipient else None,
                "amount": str(txn.amount),
                "currency": txn.currency,
                "fee": str(txn.fee) if txn.fee else "0",
                "type": txn.type,
                "status": txn.status,
                "reference": txn.reference,
                "created_at": txn.created_at.isoformat() if txn.created_at else None
            })
        
        return {"transactions": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get all transactions error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get transactions")


@app.get("/api/v1/admin/cards")
async def get_all_cards(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get all virtual cards (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Get all cards
        from shared.models.card import Card
        cards = db.query(Card).order_by(Card.created_at.desc()).all()
        
        result = []
        for card in cards:
            user = db.query(User).filter(User.id == card.user_id).first()
            if user:
                result.append({
                    "card_id": str(card.id),
                    "user_id": str(user.id),
                    "user_name": f"{user.first_name} {user.last_name}",
                    "user_email": user.email,
                    "card_number": card.card_number,
                    "cardholder_name": card.cardholder_name,
                    "card_type": card.card_type,
                    "status": card.status,
                    "currency": card.currency,
                    "balance": str(card.balance),
                    "expiry_month": card.expiry_month,
                    "expiry_year": card.expiry_year,
                    "created_at": card.created_at.isoformat() if card.created_at else None
                })
        
        return {"cards": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get all cards error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get cards")


@app.post("/api/v1/admin/cards/{card_id}/freeze")
async def admin_freeze_card(
    card_id: str,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Freeze a card (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        from shared.models.card import Card, CardStatus
        card = db.query(Card).filter(Card.id == card_id).first()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        card.status = CardStatus.BLOCKED
        db.commit()
        
        # Create audit log
        create_audit_log(db, current_user_id, current_user.email, f"Froze card", "card", card_id, f"Card {card.card_number[-4:]} frozen")
        
        return {"message": "Card frozen successfully", "status": card.status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin freeze card error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to freeze card")


@app.post("/api/v1/admin/cards/{card_id}/unfreeze")
async def admin_unfreeze_card(
    card_id: str,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Unfreeze a card (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        from shared.models.card import Card, CardStatus
        card = db.query(Card).filter(Card.id == card_id).first()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        card.status = CardStatus.ACTIVE
        db.commit()
        
        # Create audit log
        create_audit_log(db, current_user_id, current_user.email, f"Unfroze card", "card", card_id, f"Card {card.card_number[-4:]} unfrozen")
        
        return {"message": "Card unfrozen successfully", "status": card.status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin unfreeze card error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to unfreeze card")


@app.delete("/api/v1/admin/cards/{card_id}")
async def admin_delete_card(
    card_id: str,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Delete a card (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        from shared.models.card import Card
        from shared.models.wallet import Wallet
        
        card = db.query(Card).filter(Card.id == card_id).first()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        card_number_last4 = card.card_number[-4:]
        
        # If card has balance, refund to wallet
        if float(card.balance) > 0:
            wallet = db.query(Wallet).filter(
                Wallet.user_id == card.user_id,
                Wallet.currency == card.currency
            ).first()
            
            if wallet:
                wallet.balance = float(wallet.balance) + float(card.balance)
        
        db.delete(card)
        db.commit()
        
        # Create audit log
        create_audit_log(db, current_user_id, current_user.email, f"Deleted card", "card", card_id, f"Card ending in {card_number_last4} deleted")
        
        return {"message": "Card deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin delete card error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete card")


@app.get("/api/v1/admin/crypto/balances")
async def get_all_crypto_balances(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get all crypto balances (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Get all crypto balances
        from shared.models.crypto import CryptoBalance
        balances = db.query(CryptoBalance).order_by(CryptoBalance.created_at.desc()).all()
        
        result = []
        for balance in balances:
            user = db.query(User).filter(User.id == balance.user_id).first()
            if user:
                result.append({
                    "balance_id": str(balance.id),
                    "user_id": str(user.id),
                    "user_name": f"{user.first_name} {user.last_name}",
                    "user_email": user.email,
                    "currency": balance.currency,
                    "balance": str(balance.balance),
                    "created_at": balance.created_at.isoformat() if balance.created_at else None
                })
        
        return {"balances": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get all crypto balances error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get crypto balances")


@app.get("/api/v1/admin/crypto/transactions")
async def get_all_crypto_transactions(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    limit: int = 100
):
    """Get all crypto transactions (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Get all crypto transactions
        from shared.models.crypto import CryptoTransaction
        transactions = db.query(CryptoTransaction).order_by(
            CryptoTransaction.created_at.desc()
        ).limit(limit).all()
        
        result = []
        for txn in transactions:
            user = db.query(User).filter(User.id == txn.user_id).first()
            
            result.append({
                "transaction_id": str(txn.id),
                "user_id": str(txn.user_id),
                "user_name": f"{user.first_name} {user.last_name}" if user else None,
                "user_email": user.email if user else None,
                "transaction_type": txn.transaction_type,
                "currency": txn.currency,
                "amount": str(txn.amount),
                "ngn_amount": str(txn.ngn_amount) if txn.ngn_amount else None,
                "exchange_rate": str(txn.exchange_rate) if txn.exchange_rate else None,
                "status": txn.status,
                "wallet_address": txn.wallet_address,
                "blockchain_tx_hash": txn.blockchain_tx_hash,
                "confirmations": txn.confirmations,
                "created_at": txn.created_at.isoformat() if txn.created_at else None
            })
        
        return {"transactions": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get all crypto transactions error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get crypto transactions")


@app.get("/api/v1/admin/crypto/wallets")
async def get_all_crypto_wallets(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get all crypto wallets (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Get all crypto wallets
        from shared.models.crypto import CryptoWallet
        wallets = db.query(CryptoWallet).order_by(CryptoWallet.created_at.desc()).all()
        
        result = []
        for wallet in wallets:
            user = db.query(User).filter(User.id == wallet.user_id).first()
            if user:
                result.append({
                    "wallet_id": str(wallet.id),
                    "user_id": str(user.id),
                    "user_name": f"{user.first_name} {user.last_name}",
                    "user_email": user.email,
                    "currency": wallet.currency,
                    "address": wallet.address,
                    "is_active": wallet.is_active,
                    "created_at": wallet.created_at.isoformat() if wallet.created_at else None
                })
        
        return {"wallets": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get all crypto wallets error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get crypto wallets")


@app.get("/api/v1/admin/crypto/stats")
async def get_crypto_stats(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get crypto statistics (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        from shared.models.crypto import CryptoBalance, CryptoTransaction, CryptoWallet
        from sqlalchemy import func
        
        # Total crypto balances by currency
        total_balances = db.query(
            CryptoBalance.currency,
            func.sum(CryptoBalance.balance).label('total')
        ).group_by(CryptoBalance.currency).all()
        
        # Total transactions
        total_transactions = db.query(CryptoTransaction).count()
        
        # Pending transactions
        pending_transactions = db.query(CryptoTransaction).filter(
            CryptoTransaction.status == 'PENDING'
        ).count()
        
        # Total wallets
        total_wallets = db.query(CryptoWallet).count()
        
        # Recent conversions total (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_conversions = db.query(
            func.sum(CryptoTransaction.ngn_amount)
        ).filter(
            CryptoTransaction.transaction_type == 'CONVERT',
            CryptoTransaction.created_at >= thirty_days_ago
        ).scalar() or 0
        
        return {
            "total_balances": {str(curr): str(total) for curr, total in total_balances},
            "total_transactions": total_transactions,
            "pending_transactions": pending_transactions,
            "total_wallets": total_wallets,
            "recent_conversions_ngn": str(recent_conversions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get crypto stats error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get crypto stats")


# Import risk models
from shared.models.risk import RiskAlert, RiskLevel, AlertStatus

# Create admin audit log model if it doesn't exist
from sqlalchemy import Column, String, Text
from shared.models.base import BaseModel as AuditBase

class AdminAuditLog(AuditBase):
    """Admin audit log model."""
    __tablename__ = "admin_audit_logs"
    
    admin_id = Column(String(20), nullable=False, index=True)
    admin_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=True)  # user, kyc, wallet, etc.
    target_id = Column(String(20), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)


def create_audit_log(db: Session, admin_id: str, admin_email: str, action: str, target_type: str = None, target_id: str = None, details: str = None):
    """Helper function to create audit log entries."""
    try:
        log = AdminAuditLog(
            admin_id=admin_id,
            admin_email=admin_email,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to create audit log: {str(e)}")
        db.rollback()


@app.get("/api/v1/admin/audit-logs")
async def get_audit_logs(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    limit: int = 100
):
    """Get admin audit logs (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Create table if it doesn't exist
        from shared.database import engine
        AdminAuditLog.__table__.create(engine, checkfirst=True)
        
        # Get audit logs
        logs = db.query(AdminAuditLog).order_by(
            AdminAuditLog.created_at.desc()
        ).limit(limit).all()
        
        result = []
        for log in logs:
            result.append({
                "log_id": str(log.id),
                "admin_id": log.admin_id,
                "admin_email": log.admin_email,
                "action": log.action,
                "target_type": log.target_type,
                "target_id": log.target_id,
                "details": log.details,
                "timestamp": log.created_at.isoformat() if log.created_at else None
            })
        
        return {"logs": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get audit logs error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get audit logs")


@app.get("/api/v1/admin/risk/alerts")
async def get_risk_alerts(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    limit: int = 100
):
    """Get risk and fraud alerts (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Create table if it doesn't exist
        from shared.database import engine
        RiskAlert.__table__.create(engine, checkfirst=True)
        
        # Build query
        query = db.query(RiskAlert)
        
        if status:
            query = query.filter(RiskAlert.status == status)
        
        if risk_level:
            query = query.filter(RiskAlert.risk_level == risk_level)
        
        alerts = query.order_by(RiskAlert.created_at.desc()).limit(limit).all()
        
        result = []
        for alert in alerts:
            user = None
            if alert.user_id:
                user = db.query(User).filter(User.id == alert.user_id).first()
            
            result.append({
                "alert_id": str(alert.id),
                "user_id": str(alert.user_id) if alert.user_id else None,
                "user_name": f"{user.first_name} {user.last_name}" if user else None,
                "user_email": user.email if user else None,
                "alert_type": alert.alert_type,
                "risk_level": alert.risk_level.value,
                "status": alert.status.value,
                "description": alert.description,
                "amount": str(alert.amount) if alert.amount else None,
                "ip_address": alert.ip_address,
                "resolved_by": alert.resolved_by,
                "notes": alert.notes,
                "created_at": alert.created_at.isoformat() if alert.created_at else None
            })
        
        return {"alerts": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get risk alerts error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get risk alerts")


@app.get("/api/v1/admin/risk/stats")
async def get_risk_stats(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get risk and fraud statistics (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Create table if it doesn't exist
        from shared.database import engine
        RiskAlert.__table__.create(engine, checkfirst=True)
        
        # Calculate stats
        total_alerts = db.query(RiskAlert).count()
        open_alerts = db.query(RiskAlert).filter(RiskAlert.status == AlertStatus.OPEN).count()
        critical_alerts = db.query(RiskAlert).filter(RiskAlert.risk_level == RiskLevel.CRITICAL).count()
        high_alerts = db.query(RiskAlert).filter(RiskAlert.risk_level == RiskLevel.HIGH).count()
        resolved_alerts = db.query(RiskAlert).filter(RiskAlert.status == AlertStatus.RESOLVED).count()
        false_positives = db.query(RiskAlert).filter(RiskAlert.status == AlertStatus.FALSE_POSITIVE).count()
        
        return {
            "total_alerts": total_alerts,
            "open_alerts": open_alerts,
            "critical_alerts": critical_alerts,
            "high_alerts": high_alerts,
            "resolved_alerts": resolved_alerts,
            "false_positives": false_positives
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get risk stats error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get risk statistics")


class UpdateAlertStatusRequest(BaseModel):
    status: str  # OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    notes: Optional[str] = None


@app.post("/api/v1/admin/risk/alerts/{alert_id}/update")
async def update_risk_alert(
    alert_id: str,
    request: UpdateAlertStatusRequest,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Update risk alert status (admin only)."""
    try:
        current_user_id = get_current_user_id(credentials)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin check
        if current_user.email not in ['admin@bengo.com', 'emzzygee000@gmail.com']:
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Find alert
        alert = db.query(RiskAlert).filter(RiskAlert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        # Update status
        alert.status = AlertStatus[request.status]
        if request.notes:
            alert.notes = request.notes
        alert.resolved_by = str(current_user_id)
        alert.resolved_at = datetime.utcnow().isoformat()
        
        # Create audit log
        create_audit_log(
            db, 
            str(current_user_id), 
            current_user.email, 
            f"UPDATE_RISK_ALERT_{request.status}", 
            "risk_alert", 
            alert_id,
            f"Updated risk alert to {request.status}. Notes: {request.notes or 'None'}"
        )
        
        db.commit()
        
        logger.info(f"Admin {current_user.email} updated risk alert {alert_id} to {request.status}")
        
        return {"message": "Alert updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update risk alert error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update alert")


# ========== P2P MONEY TRANSFER ENDPOINT ==========

class P2PTransferRequest(BaseModel):
    recipient_identifier: str  # Can be email, phone, or user ID
    amount: float
    description: Optional[str] = "P2P Transfer"
    pin: Optional[str] = None  # Optional PIN for security


@app.post("/api/v1/payments/p2p-transfer")
async def p2p_transfer(
    request: P2PTransferRequest,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Transfer money from one BenGo user to another."""
    try:
        # Get current user (sender)
        sender_id = get_current_user_id(credentials)
        sender = db.query(User).filter(User.id == sender_id).first()
        if not sender:
            raise HTTPException(status_code=404, detail="Sender not found")
        
        # Validate amount
        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
        if request.amount > 5000000:  # ₦5M limit per transaction
            raise HTTPException(status_code=400, detail="Amount exceeds transaction limit of ₦5,000,000")
        
        # Find recipient by email, phone, or ID
        recipient = None
        if '@' in request.recipient_identifier:
            # Search by email
            recipient = db.query(User).filter(User.email == request.recipient_identifier).first()
        elif request.recipient_identifier.isdigit():
            # Search by ID or phone
            recipient = db.query(User).filter(
                (User.id == request.recipient_identifier) | 
                (User.phone == request.recipient_identifier)
            ).first()
        else:
            # Try as phone number
            recipient = db.query(User).filter(User.phone == request.recipient_identifier).first()
        
        if not recipient:
            raise HTTPException(
                status_code=404,
                detail="Recipient not found. Please check email, phone number, or user ID."
            )
        
        # Prevent self-transfer
        if sender.id == recipient.id:
            raise HTTPException(status_code=400, detail="Cannot transfer to yourself")
        
        # Check if recipient account is active
        if not recipient.is_active:
            raise HTTPException(status_code=400, detail="Recipient account is inactive")
        
        # Get sender's NGN wallet
        from shared.models.wallet import Wallet
        sender_wallet = db.query(Wallet).filter(
            Wallet.user_id == sender_id,
            Wallet.currency == "NGN"
        ).first()
        
        if not sender_wallet:
            raise HTTPException(status_code=404, detail="Sender wallet not found")
        
        # Check if sender wallet is locked
        if sender_wallet.is_locked:
            raise HTTPException(
                status_code=403,
                detail="Your wallet is currently frozen. Please contact support."
            )
        
        # Calculate fee (0.5% with minimum ₦10 and maximum ₦1000)
        fee = max(10.0, min(request.amount * 0.005, 1000.0))
        total_debit = request.amount + fee
        
        # Check sufficient balance
        if float(sender_wallet.balance) < total_debit:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance. You need ₦{total_debit:,.2f} (Amount: ₦{request.amount:,.2f} + Fee: ₦{fee:,.2f})"
            )
        
        # Get or create recipient's NGN wallet
        recipient_wallet = db.query(Wallet).filter(
            Wallet.user_id == recipient.id,
            Wallet.currency == "NGN"
        ).first()
        
        if not recipient_wallet:
            # Create wallet for recipient
            recipient_wallet = Wallet(
                user_id=recipient.id,
                currency="NGN",
                balance=0.00,
                pending_balance=0.00
            )
            db.add(recipient_wallet)
            db.flush()
        
        # Check if recipient wallet is locked
        if recipient_wallet.is_locked:
            raise HTTPException(
                status_code=403,
                detail="Recipient's wallet is frozen. Transfer cannot be completed."
            )
        
        # Generate transaction reference
        import secrets
        reference = f"P2P{secrets.token_hex(8).upper()}"
        
        # Create transaction record
        from shared.models.transaction import Transaction
        transaction = Transaction(
            user_id=sender_id,
            recipient_id=recipient.id,
            transaction_type="P2P_TRANSFER",
            status="COMPLETED",
            amount=request.amount,
            currency="NGN",
            fee=fee,
            net_amount=request.amount - fee,
            description=request.description or "P2P Transfer",
            reference=reference
        )
        db.add(transaction)
        db.flush()
        
        # Update wallet balances (ATOMIC OPERATION)
        sender_wallet.balance = float(sender_wallet.balance) - total_debit
        recipient_wallet.balance = float(recipient_wallet.balance) + request.amount
        
        # Create ledger entries for double-entry bookkeeping
        from shared.models.wallet import LedgerEntry
        
        # Sender debit entry
        sender_ledger = LedgerEntry(
            wallet_id=sender_wallet.id,
            transaction_id=str(transaction.id),
            account_type="ASSET",
            entry_type="DEBIT",
            amount=total_debit,
            currency="NGN",
            description=f"P2P Transfer to {recipient.first_name} {recipient.last_name}",
            reference=reference
        )
        db.add(sender_ledger)
        
        # Recipient credit entry
        recipient_ledger = LedgerEntry(
            wallet_id=recipient_wallet.id,
            transaction_id=str(transaction.id),
            account_type="ASSET",
            entry_type="CREDIT",
            amount=request.amount,
            currency="NGN",
            description=f"P2P Transfer from {sender.first_name} {sender.last_name}",
            reference=reference
        )
        db.add(recipient_ledger)
        
        # Fee entry (platform revenue)
        if fee > 0:
            fee_ledger = LedgerEntry(
                wallet_id=sender_wallet.id,
                transaction_id=str(transaction.id),
                account_type="REVENUE",
                entry_type="CREDIT",
                amount=fee,
                currency="NGN",
                description="Transaction fee",
                reference=reference
            )
            db.add(fee_ledger)
        
        # Commit all changes
        db.commit()
        db.refresh(transaction)
        
        logger.info(
            f"P2P Transfer completed: {sender.email} -> {recipient.email}, "
            f"Amount: ₦{request.amount:,.2f}, Fee: ₦{fee:,.2f}, Ref: {reference}"
        )
        
        return {
            "success": True,
            "message": "Transfer completed successfully",
            "transaction": {
                "id": str(transaction.id),
                "reference": reference,
                "amount": float(request.amount),
                "fee": float(fee),
                "total_debit": float(total_debit),
                "recipient_name": f"{recipient.first_name} {recipient.last_name}",
                "recipient_email": recipient.email,
                "new_balance": float(sender_wallet.balance),
                "status": "COMPLETED",
                "timestamp": transaction.created_at.isoformat() if transaction.created_at else None
            }
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"P2P transfer error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Transfer failed: {str(e)}"
        )


@app.get("/api/v1/payments/search-user/{identifier}")
async def search_user_for_transfer(
    identifier: str,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Search for a user by email, phone, or ID for P2P transfer."""
    try:
        current_user_id = get_current_user_id(credentials)
        
        # Find user
        user = None
        if '@' in identifier:
            user = db.query(User).filter(User.email == identifier).first()
        elif identifier.isdigit():
            user = db.query(User).filter(
                (User.id == identifier) | (User.phone == identifier)
            ).first()
        else:
            user = db.query(User).filter(User.phone == identifier).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Don't allow searching for yourself
        if user.id == current_user_id:
            raise HTTPException(status_code=400, detail="Cannot transfer to yourself")
        
        return {
            "found": True,
            "user": {
                "id": str(user.id),
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "phone": user.phone or "Not provided",
                "is_active": user.is_active
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search user error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to search user")


# ========== WALLET DEPOSIT ENDPOINT ==========

class DepositRequest(BaseModel):
    amount: float
    payment_method: str  # 'card', 'transfer', 'ussd'


@app.post("/api/v1/wallet/deposit/initialize")
async def initialize_deposit(
    request: DepositRequest,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Initialize wallet deposit (Paystack integration or manual)."""
    try:
        user_id = get_current_user_id(credentials)
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Validate amount
        if request.amount < 100:
            raise HTTPException(status_code=400, detail="Minimum deposit is ₦100")
        
        if request.amount > 10000000:
            raise HTTPException(status_code=400, detail="Maximum deposit is ₦10,000,000")
        
        # Get or create user's NGN wallet
        from shared.models.wallet import Wallet
        wallet = db.query(Wallet).filter(
            Wallet.user_id == user_id,
            Wallet.currency == "NGN"
        ).first()
        
        if not wallet:
            wallet = Wallet(
                user_id=user_id,
                currency="NGN",
                balance=0.00,
                pending_balance=0.00
            )
            db.add(wallet)
            db.flush()
        
        # Generate reference
        reference = f"DEP{secrets.token_hex(8).upper()}"
        
        if request.payment_method == 'card':
            # REAL PAYSTACK INTEGRATION
            paystack_secret_key = settings.paystack_secret_key
            
            if not paystack_secret_key:
                raise HTTPException(
                    status_code=500,
                    detail="Paystack is not configured. Please add PAYSTACK_SECRET_KEY to .env file"
                )
            
            # Create pending transaction first
            from shared.models.transaction import Transaction
            transaction = Transaction(
                user_id=user_id,
                transaction_type="DEPOSIT",
                status="PENDING",
                amount=request.amount,
                currency="NGN",
                fee=0.00,
                description=f"Wallet deposit via {request.payment_method}",
                reference=reference
            )
            db.add(transaction)
            db.commit()
            
            # Initialize Paystack transaction
            paystack_url = f"{settings.paystack_base_url}/transaction/initialize"
            paystack_payload = {
                "email": user.email,
                "amount": int(request.amount * 100),  # Paystack uses kobo (₦1 = 100 kobo)
                "reference": reference,
                "callback_url": "http://localhost:3000/wallet?deposit=success",  # Frontend callback
                "metadata": {
                    "user_id": user_id,
                    "transaction_id": str(transaction.id),
                    "wallet_id": str(wallet.id)
                }
            }
            
            try:
                async with httpx.AsyncClient() as client:
                    paystack_response = await client.post(
                        paystack_url,
                        json=paystack_payload,
                        headers={
                            "Authorization": f"Bearer {paystack_secret_key}",
                            "Content-Type": "application/json"
                        },
                        timeout=30.0
                    )
                
                if paystack_response.status_code != 200:
                    logger.error(f"Paystack API error: {paystack_response.text}")
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to initialize payment with Paystack"
                    )
                
                paystack_data = paystack_response.json()
                
                if not paystack_data.get("status"):
                    raise HTTPException(
                        status_code=500,
                        detail=paystack_data.get("message", "Paystack initialization failed")
                    )
                
                authorization_url = paystack_data["data"]["authorization_url"]
                access_code = paystack_data["data"]["access_code"]
                
                logger.info(f"Paystack payment initialized: {user.email}, Amount: ₦{request.amount:,.2f}, Ref: {reference}")
                
                return {
                    "success": True,
                    "message": "Payment initialized. Redirecting to Paystack...",
                    "reference": reference,
                    "amount": request.amount,
                    "authorization_url": authorization_url,
                    "access_code": access_code
                }
                
            except httpx.RequestError as e:
                logger.error(f"Paystack request error: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to connect to Paystack. Please try again."
                )
        
        elif request.payment_method == 'transfer':
            # Bank Transfer - Requires Paystack Dedicated Virtual Accounts
            # For now, show instructions to use Card payment instead
            raise HTTPException(
                status_code=501,
                detail="Bank transfer is not yet available. Please use Card payment (via Paystack) instead. "
                       "To enable bank transfers, set up Paystack Dedicated Virtual Accounts - see PAYSTACK_SETUP.md"
            )
        
        else:  # ussd
            # USSD - Requires bank integration
            raise HTTPException(
                status_code=501,
                detail="USSD payment is not yet available. Please use Card payment (via Paystack) instead."
            )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Deposit initialization error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to initialize deposit: {str(e)}")


# Paystack Webhook - Verify and credit wallet
@app.post("/api/v1/wallet/deposit/webhook")
async def paystack_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Paystack webhook to verify and complete deposits.
    This endpoint is called by Paystack when a payment is completed.
    """
    try:
        # Get the webhook payload
        payload = await request.json()
        event = payload.get("event")
        data = payload.get("data", {})
        
        logger.info(f"Paystack webhook received: {event}")
        
        # Only process successful charge events
        if event != "charge.success":
            logger.info(f"Ignoring non-success event: {event}")
            return {"status": "ignored"}
        
        # Extract transaction details
        reference = data.get("reference")
        amount = data.get("amount", 0) / 100  # Convert from kobo to naira
        status = data.get("status")
        metadata = data.get("metadata", {})
        
        if status != "success":
            logger.warning(f"Payment not successful: {reference}, status: {status}")
            return {"status": "failed"}
        
        # Find the transaction
        from shared.models.transaction import Transaction
        transaction = db.query(Transaction).filter(
            Transaction.reference == reference
        ).first()
        
        if not transaction:
            logger.error(f"Transaction not found: {reference}")
            return {"status": "transaction_not_found"}
        
        # Check if already processed
        if transaction.status == "COMPLETED":
            logger.info(f"Transaction already completed: {reference}")
            return {"status": "already_processed"}
        
        # Get wallet
        from shared.models.wallet import Wallet
        wallet_id = metadata.get("wallet_id") or transaction.user_id
        wallet = db.query(Wallet).filter(
            Wallet.id == wallet_id
        ).first()
        
        if not wallet:
            # Fallback: get user's NGN wallet
            wallet = db.query(Wallet).filter(
                Wallet.user_id == transaction.user_id,
                Wallet.currency == "NGN"
            ).first()
        
        if not wallet:
            logger.error(f"Wallet not found for transaction: {reference}")
            return {"status": "wallet_not_found"}
        
        # Credit the wallet
        wallet.balance = float(wallet.balance) + amount
        
        # Update transaction status
        transaction.status = "COMPLETED"
        transaction.amount = amount
        
        # Create ledger entry
        from shared.models.wallet import LedgerEntry
        ledger = LedgerEntry(
            wallet_id=wallet.id,
            transaction_id=str(transaction.id),
            account_type="ASSET",
            entry_type="CREDIT",
            amount=amount,
            currency="NGN",
            description=f"Wallet deposit via Paystack (Ref: {reference})",
            reference=reference
        )
        db.add(ledger)
        
        db.commit()
        
        logger.info(f"✅ Deposit completed: User {transaction.user_id}, Amount: ₦{amount:,.2f}, Ref: {reference}")
        
        return {"status": "success", "message": "Payment verified and wallet credited"}
        
    except Exception as e:
        db.rollback()
        logger.error(f"Webhook processing error: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}


# Wallet routes - Direct endpoints (before proxy)
@app.get("/api/v1/wallet/balance")
async def get_wallet_balance_direct(
    currency: str = "NGN",
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get user's wallet balance directly without forwarding."""
    try:
        user_id = get_current_user_id(credentials)
        from shared.models.wallet import Wallet
        
        wallet = db.query(Wallet).filter(
            Wallet.user_id == user_id,
            Wallet.currency == currency
        ).first()
        
        if not wallet:
            return {
                "currency": currency,
                "available_balance": "0.00",
                "pending_balance": "0.00",
                "total_balance": "0.00"
            }
        
        # Calculate balances
        available = float(wallet.balance) if wallet.balance else 0.0
        pending = float(wallet.pending_balance) if wallet.pending_balance else 0.0
        total = available + pending
        
        return {
            "currency": wallet.currency,
            "available_balance": f"{available:.2f}",
            "pending_balance": f"{pending:.2f}",
            "total_balance": f"{total:.2f}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get wallet balance error: {str(e)}", exc_info=True)
        return {"balance": "0.00", "currency": currency}


@app.get("/api/v1/wallet/transactions")
async def get_wallet_transactions_direct(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get user's wallet transactions directly without forwarding."""
    try:
        user_id = get_current_user_id(credentials)
        from shared.models.transaction import Transaction
        
        offset = (page - 1) * limit
        transactions = db.query(Transaction).filter(
            (Transaction.user_id == user_id) | (Transaction.recipient_id == user_id)
        ).order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()
        
        total = db.query(Transaction).filter(
            (Transaction.user_id == user_id) | (Transaction.recipient_id == user_id)
        ).count()
        
        return {
            "transactions": [
                {
                    "id": str(txn.id),
                    "type": txn.type,
                    "amount": str(txn.amount),
                    "currency": txn.currency,
                    "status": txn.status,
                    "reference": txn.reference,
                    "created_at": txn.created_at.isoformat() if txn.created_at else None
                }
                for txn in transactions
            ],
            "total": total,
            "page": page,
            "limit": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get transactions error: {str(e)}", exc_info=True)
        return {"transactions": [], "total": 0, "page": page, "limit": limit}


@app.api_route("/api/v1/wallet/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def wallet_proxy(path: str, request: Request):
    """Proxy requests to wallet service."""
    return await forward_request("wallet", f"/api/v1/wallet/{path}", request.method, request)


# Payments routes
@app.api_route("/api/v1/payments/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def payments_proxy(path: str, request: Request):
    """Proxy requests to payments service."""
    return await forward_request("payments", f"/api/v1/payments/{path}", request.method, request)


# Cards routes - DISABLED: Using direct endpoints instead
# @app.api_route("/api/v1/cards/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
# async def cards_proxy(path: str, request: Request):
#     """Proxy requests to cards service."""
#     return await forward_request("cards", f"/api/v1/cards/{path}", request.method, request)


# Loans routes
@app.api_route("/api/v1/loans/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def loans_proxy(path: str, request: Request):
    """Proxy requests to loans service."""
    return await forward_request("loans", f"/api/v1/loans/{path}", request.method, request)


# Crypto routes
# Crypto Deposit Endpoints (Coinbase Commerce)
@app.post("/api/v1/crypto/deposit/initialize")
async def initialize_crypto_deposit(
    request: Request,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Initialize crypto deposit using NOWPayments.
    Creates an invoice and returns deposit address.
    """
    try:
        user_id = get_current_user_id(credentials)
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        body = await request.json()
        currency = body.get('currency', 'USDT')  # BTC, ETH, or USDT
        amount_ngn = body.get('amount', 10000)  # Amount in NGN
        
        # Validate
        if currency not in ['BTC', 'ETH', 'USDT']:
            raise HTTPException(status_code=400, detail="Invalid currency")
        
        if amount_ngn < 30000:
            raise HTTPException(status_code=400, detail="Minimum deposit is ₦30,000 (NOWPayments requirement)")
        
        # Check if NOWPayments is configured
        api_key = settings.nowpayments_api_key
        
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="NOWPayments is not configured. Please add NOWPAYMENTS_API_KEY to .env file."
            )
        
        # Convert NGN to USD (approximate)
        usd_rate = 1500  # ₦1 = $0.00067, or $1 = ₦1500
        amount_usd = amount_ngn / usd_rate
        
        # Map currency codes for NOWPayments
        nowpayments_currency = currency.lower()
        if currency == 'USDT':
            nowpayments_currency = 'usdttrc20'  # USDT on Tron network (lowest fees)
        
        # Create NOWPayments invoice
        invoice_data = {
            "price_amount": round(amount_usd, 2),
            "price_currency": "usd",
            "pay_currency": nowpayments_currency,
            "order_id": f"BENGO-{user_id}-{int(datetime.utcnow().timestamp())}",
            "order_description": f"BenGo Wallet Deposit - {currency}",
            "ipn_callback_url": "http://localhost:8000/api/v1/crypto/deposit/webhook",
            "success_url": "http://localhost:3000/dashboard?deposit=success",
            "cancel_url": "http://localhost:3000/dashboard?deposit=cancelled"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.nowpayments_api_url}/invoice",
                    json=invoice_data,
                    headers={
                        "x-api-key": api_key,
                        "Content-Type": "application/json"
                    },
                    timeout=30.0
                )
            
            if response.status_code != 200:
                logger.error(f"NOWPayments error: {response.text}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to create invoice: {response.text}"
                )
            
            invoice = response.json()
            
            # Log the full response to debug
            logger.info(f"NOWPayments Response: {invoice}")
            
            # Get payment address
            pay_address = invoice.get('pay_address')
            invoice_id = invoice.get('id')
            invoice_url = invoice.get('invoice_url')
            pay_amount = invoice.get('pay_amount')
            
            logger.info(f"Payment address for {currency}: {pay_address}")
            
            # Generate QR code for the address
            import qrcode
            import io
            import base64
            
            qr = qrcode.QRCode(version=1, box_size=10, border=2)
            qr.add_data(pay_address)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white")
            
            buffer = io.BytesIO()
            qr_img.save(buffer, format='PNG')
            qr_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            # Save invoice info to database for tracking
            from shared.models.crypto import CryptoTransaction
            transaction = CryptoTransaction(
                user_id=user_id,
                transaction_type="FUND",
                currency=currency,
                amount=0,  # Will be updated when payment is received
                ngn_amount=amount_ngn,
                status="PENDING",
                wallet_address=pay_address,
                blockchain_tx_hash=str(invoice_id)  # Use invoice ID for tracking
            )
            db.add(transaction)
            db.commit()
            
            logger.info(f"Crypto deposit initialized: User {user_id}, Currency: {currency}, Invoice: {invoice_id}")
            
            return {
                'success': True,
                'invoice_id': invoice_id,
                'payment_id': invoice.get('payment_id'),
                'hosted_url': invoice_url,  # NOWPayments payment page
                'address': pay_address,
                'qr_code': f"data:image/png;base64,{qr_base64}",
                'expires_at': invoice.get('created_at'),  # NOWPayments invoices don't expire quickly
                'amount_crypto': {'amount': str(pay_amount), 'currency': currency},
                'currency': currency
            }
            
        except httpx.RequestError as e:
            logger.error(f"NOWPayments request error: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail="Crypto deposit service is temporarily unavailable. Please check your internet connection or try again later."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initializing crypto deposit: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to initialize deposit: {str(e)}")


# NOWPayments Webhook (IPN)
@app.post("/api/v1/crypto/deposit/webhook")
async def nowpayments_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook to receive payment notifications from NOWPayments.
    This is called when a user sends crypto.
    """
    try:
        # Verify webhook signature (IPN Secret)
        import hmac
        import hashlib
        import json
        
        signature = request.headers.get('x-nowpayments-sig')
        payload_bytes = await request.body()
        payload_str = payload_bytes.decode('utf-8')
        
        ipn_secret = settings.nowpayments_ipn_secret
        
        if ipn_secret and signature:
            # Sort keys and create signature
            computed_signature = hmac.new(
                ipn_secret.encode(),
                payload_bytes,
                hashlib.sha512
            ).hexdigest()
            
            if not hmac.compare_digest(signature, computed_signature):
                logger.warning("Invalid webhook signature")
                raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse event
        event = json.loads(payload_str)
        
        payment_status = event.get('payment_status')
        payment_id = event.get('payment_id')
        invoice_id = event.get('invoice_id')
        order_id = event.get('order_id')
        
        logger.info(f"NOWPayments webhook received: Status={payment_status}, Invoice={invoice_id}")
        
        # Only process finished/confirmed payments
        if payment_status in ['finished', 'confirmed']:
            pay_amount = float(event.get('pay_amount', 0))
            pay_currency = event.get('pay_currency', 'USDT').upper()
            price_amount = float(event.get('price_amount', 0))
            price_currency = event.get('price_currency', 'USD').upper()
            
            # Extract user_id from order_id (format: BENGO-{user_id}-{timestamp})
            try:
                user_id = order_id.split('-')[1]
            except:
                logger.error(f"Invalid order_id format: {order_id}")
                return {"status": "error", "message": "Invalid order_id"}
            
            # Map currency back to standard format
            currency = pay_currency
            if 'USDT' in pay_currency.upper():
                currency = 'USDT'
            
            # Calculate NGN amount (USD * rate)
            usd_rate = 1500
            amount_ngn = price_amount * usd_rate
            
            # Update transaction
            from shared.models.crypto import CryptoTransaction
            transaction = db.query(CryptoTransaction).filter(
                CryptoTransaction.user_id == user_id,
                CryptoTransaction.blockchain_tx_hash == str(invoice_id)
            ).first()
            
            if transaction:
                transaction.amount = pay_amount
                transaction.status = "CONFIRMED"
            else:
                # Create new transaction if not found
                transaction = CryptoTransaction(
                    user_id=user_id,
                    transaction_type="FUND",
                    currency=currency,
                    amount=pay_amount,
                    ngn_amount=amount_ngn,
                    status="CONFIRMED",
                    blockchain_tx_hash=str(payment_id)
                )
                db.add(transaction)
            
            # Credit user's NGN wallet
            from shared.models.wallet import Wallet
            wallet = db.query(Wallet).filter(
                Wallet.user_id == user_id,
                Wallet.currency == "NGN"
            ).first()
            
            if wallet:
                wallet.balance = float(wallet.balance) + amount_ngn
                
                # Create ledger entry
                from shared.models.wallet import LedgerEntry
                ledger = LedgerEntry(
                    wallet_id=wallet.id,
                    transaction_id=str(transaction.id) if transaction else None,
                    account_type="ASSET",
                    entry_type="CREDIT",
                    amount=amount_ngn,
                    currency="NGN",
                    description=f"Crypto deposit: {pay_amount} {currency}",
                    reference=str(payment_id)
                )
                db.add(ledger)
            
            db.commit()
            
            logger.info(f"✅ Crypto deposit confirmed: User {user_id}, {pay_amount} {currency} = ₦{amount_ngn:,.2f}")
            
            return {"status": "success", "message": "Payment processed"}
        
        return {"status": "ignored", "payment_status": payment_status}
        
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}


# ============================================================================
# BILL PAYMENT ENDPOINTS
# ============================================================================

class BillPurchaseRequest(BaseModel):
    """Bill purchase request model."""
    bill_type: str  # airtime, data, tv
    provider_code: str  # mtn, airtel, dstv, etc
    amount: float
    phone_number: Optional[str] = None  # For airtime/data
    account_number: Optional[str] = None  # For TV
    data_plan_code: Optional[str] = None  # For data bundles


@app.get("/api/v1/bills/providers")
async def get_bill_providers(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get available bill providers."""
    try:
        from shared.models.bill import BillProvider
        
        query = db.query(BillProvider).filter(BillProvider.is_active == True)
        
        if category:
            query = query.filter(BillProvider.category == category)
        
        providers = query.all()
        
        return {
            "providers": [
                {
                    "id": p.id,
                    "name": p.name,
                    "category": p.category,
                    "api_code": p.api_code
                }
                for p in providers
            ]
        }
    
    except Exception as e:
        logger.error(f"Get providers error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch providers")


@app.post("/api/v1/bills/purchase")
async def purchase_bill(
    purchase_request: BillPurchaseRequest,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Purchase a bill."""
    try:
        user_id = get_current_user_id(credentials)
        
        from shared.models.bill import Bill, BillTransaction
        from shared.models.wallet import Wallet, LedgerEntry
        from shared.utils.vtu_provider import get_vtu_provider
        import secrets
        
        # Validate amount
        if purchase_request.amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid amount")
        
        # Check wallet balance
        wallet = db.query(Wallet).filter(
            Wallet.user_id == user_id,
            Wallet.currency == "NGN"
        ).first()
        
        if not wallet or wallet.balance < purchase_request.amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance. You need ₦{purchase_request.amount:,.2f}"
            )
        
        # Create bill record
        reference = f"BILL{secrets.token_hex(8).upper()}"
        bill = Bill(
            user_id=user_id,
            bill_type=purchase_request.bill_type,
            provider_code=purchase_request.provider_code,
            provider_name=purchase_request.provider_code.upper(),
            reference=reference,
            amount=purchase_request.amount,
            phone_number=purchase_request.phone_number,
            account_number=purchase_request.account_number,
            status="pending"
        )
        db.add(bill)
        db.flush()  # Get bill ID
        
        # Debit wallet (pending state)
        wallet.balance -= purchase_request.amount
        
        # Create ledger entry (debit)
        ledger = LedgerEntry(
            user_id=user_id,
            wallet_id=wallet.id,
            transaction_type="debit",
            amount=purchase_request.amount,
            currency="NGN",
            description=f"Bill payment: {purchase_request.bill_type} - {purchase_request.provider_code}",
            reference=reference
        )
        db.add(ledger)
        
        # Create bill transaction record
        bill_txn = BillTransaction(
            bill_id=bill.id,
            wallet_transaction_id=ledger.id if hasattr(ledger, 'id') else None,
            status="pending"
        )
        db.add(bill_txn)
        db.commit()
        
        # Call VTU provider
        vtu_provider = get_vtu_provider()
        
        if purchase_request.bill_type == "airtime":
            result = await vtu_provider.purchase_airtime(
                network=purchase_request.provider_code,
                phone_number=purchase_request.phone_number,
                amount=purchase_request.amount
            )
        elif purchase_request.bill_type == "data":
            result = await vtu_provider.purchase_data(
                network=purchase_request.provider_code,
                phone_number=purchase_request.phone_number,
                data_plan_code=purchase_request.data_plan_code or "DEFAULT",
                amount=purchase_request.amount
            )
        elif purchase_request.bill_type == "tv":
            result = await vtu_provider.pay_tv_subscription(
                provider=purchase_request.provider_code,
                smartcard_number=purchase_request.account_number,
                package_code="DEFAULT",
                amount=purchase_request.amount
            )
        else:
            result = {"status": "failed", "message": "Unsupported bill type"}
        
        # Update bill and transaction status
        if result["status"] == "success":
            bill.status = "success"
            bill.provider_reference = result.get("provider_reference")
            bill_txn.status = "success"
            bill_txn.provider_response = result
        else:
            # Revert wallet debit on failure
            bill.status = "failed"
            bill_txn.status = "failed"
            bill_txn.provider_response = result
            wallet.balance += purchase_request.amount  # Refund
        
        db.commit()
        
        return {
            "status": bill.status,
            "reference": bill.reference,
            "message": result.get("message", "Bill payment processed"),
            "amount": float(bill.amount),
            "provider": bill.provider_name
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bill purchase error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Bill purchase failed: {str(e)}")


@app.get("/api/v1/bills/history")
async def get_bill_history(
    page: int = 1,
    limit: int = 20,
    bill_type: Optional[str] = None,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get user's bill payment history."""
    try:
        user_id = get_current_user_id(credentials)
        
        from shared.models.bill import Bill
        
        query = db.query(Bill).filter(Bill.user_id == user_id)
        
        if bill_type:
            query = query.filter(Bill.bill_type == bill_type)
        
        offset = (page - 1) * limit
        bills = query.order_by(Bill.created_at.desc()).offset(offset).limit(limit).all()
        total = query.count()
        
        return {
            "bills": [
                {
                    "id": bill.id,
                    "bill_type": bill.bill_type,
                    "provider": bill.provider_name,
                    "amount": float(bill.amount),
                    "status": bill.status,
                    "reference": bill.reference,
                    "phone_number": bill.phone_number,
                    "account_number": bill.account_number,
                    "created_at": bill.created_at.isoformat() if bill.created_at else None
                }
                for bill in bills
            ],
            "total": total,
            "page": page,
            "limit": limit
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get bill history error: {str(e)}", exc_info=True)
        return {"bills": [], "total": 0, "page": page, "limit": limit}


# Direct crypto endpoints (before proxy to avoid forwarding)
@app.get("/api/v1/crypto/balances")
async def get_crypto_balances_direct(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get user's crypto balances directly without forwarding."""
    try:
        user_id = get_current_user_id(credentials)
        from shared.models.crypto import CryptoBalance
        
        balances = db.query(CryptoBalance).filter(CryptoBalance.user_id == user_id).all()
        
        # Get crypto wallet addresses
        from shared.models.crypto import CryptoWallet
        wallets = db.query(CryptoWallet).filter(CryptoWallet.user_id == user_id).all()
        wallet_map = {w.currency: w.address for w in wallets}
        
        return {
            "balances": [
                {
                    "currency": bal.currency,
                    "balance": str(bal.balance),
                    "ngn_value": str(bal.ngn_value),
                    "wallet_address": wallet_map.get(bal.currency, "")
                }
                for bal in balances
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get crypto balances error: {str(e)}", exc_info=True)
        # Return empty balances instead of error for better UX
        return {"balances": []}


# Direct card endpoints
class CreateCardRequest(BaseModel):
    cardholder_name: Optional[str] = None
    currency: str = "NGN"

class FundCardRequest(BaseModel):
    amount: float

@app.post("/api/v1/cards/create")
async def create_card_direct(
    request: CreateCardRequest,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a new virtual card."""
    try:
        user_id = get_current_user_id(credentials)
        from shared.models.card import Card, CardStatus, CardType
        from shared.models.user import User
        import random
        import hashlib
        
        # Get user info
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate card details
        from shared.utils.encryption import encrypt_value
        
        card_number = f"5399{''.join([str(random.randint(0, 9)) for _ in range(12)])}"
        cvv = ''.join([str(random.randint(0, 9)) for _ in range(3)])
        cvv_encrypted = encrypt_value(cvv)
        
        cardholder_name = request.cardholder_name or f"{user.first_name} {user.last_name}".upper()
        
        # Create card
        card = Card(
            user_id=user_id,
            card_number=card_number,
            cardholder_name=cardholder_name,
            expiry_month=12,
            expiry_year=datetime.now().year + 3,
            cvv_hash=cvv_encrypted,  # Now encrypted instead of hashed
            card_type=CardType.VIRTUAL,
            status=CardStatus.ACTIVE,
            currency=request.currency,
            balance=0.00
        )
        
        db.add(card)
        db.commit()
        db.refresh(card)
        
        # Return card with CVV (only shown once)
        return {
            "card_id": card.id,
            "card_number": card.card_number,
            "cardholder_name": card.cardholder_name,
            "expiry_month": card.expiry_month,
            "expiry_year": card.expiry_year,
            "cvv": cvv,  # Only returned on creation
            "card_type": card.card_type,
            "status": card.status,
            "currency": card.currency,
            "balance": str(card.balance),
            "created_at": card.created_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create card error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create card")

@app.get("/api/v1/cards")
async def get_cards_direct(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get all user's cards."""
    try:
        user_id = get_current_user_id(credentials)
        from shared.models.card import Card
        
        cards = db.query(Card).filter(Card.user_id == user_id).order_by(Card.created_at.desc()).all()
        
        return {
            "cards": [
                {
                    "card_id": card.id,
                    "card_number": card.card_number,
                    "cardholder_name": card.cardholder_name,
                    "expiry_month": card.expiry_month,
                    "expiry_year": card.expiry_year,
                    "card_type": card.card_type,
                    "status": card.status,
                    "currency": card.currency,
                    "balance": str(card.balance),
                    "created_at": card.created_at.isoformat()
                }
                for card in cards
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get cards error: {str(e)}", exc_info=True)
        return {"cards": []}

@app.post("/api/v1/cards/{card_id}/fund")
async def fund_card_direct(
    card_id: str,
    request: FundCardRequest,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Fund a card from wallet."""
    try:
        user_id = get_current_user_id(credentials)
        from shared.models.card import Card
        from shared.models.wallet import Wallet
        from shared.models.transaction import Transaction, TransactionType, TransactionStatus
        
        # Get card
        card = db.query(Card).filter(Card.id == card_id, Card.user_id == user_id).first()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        if card.status != "ACTIVE":
            raise HTTPException(status_code=400, detail="Card is not active")
        
        # Get user wallet
        wallet = db.query(Wallet).filter(
            Wallet.user_id == user_id,
            Wallet.currency == card.currency
        ).first()
        
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")
        
        if float(wallet.balance) < request.amount:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
        
        # Deduct from wallet
        wallet.balance = float(wallet.balance) - request.amount
        
        # Add to card
        card.balance = float(card.balance) + request.amount
        
        # Create transaction
        transaction = Transaction(
            user_id=user_id,
            transaction_type=TransactionType.CARD_PAYMENT,
            status=TransactionStatus.COMPLETED,
            amount=request.amount,
            currency=card.currency,
            fee=0.00,
            net_amount=request.amount,
            description=f"Card funding - {card.card_number[-4:]}",
            reference=f"CARD-FUND-{card.id}-{datetime.now().timestamp()}"
        )
        
        db.add(transaction)
        db.commit()
        
        return {
            "message": "Card funded successfully",
            "card_balance": str(card.balance),
            "wallet_balance": str(wallet.balance)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fund card error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to fund card")

@app.post("/api/v1/cards/{card_id}/freeze")
async def freeze_card_direct(
    card_id: str,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Freeze a card."""
    try:
        user_id = get_current_user_id(credentials)
        from shared.models.card import Card, CardStatus
        
        card = db.query(Card).filter(Card.id == card_id, Card.user_id == user_id).first()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        card.status = CardStatus.BLOCKED
        db.commit()
        
        return {"message": "Card frozen successfully", "status": card.status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Freeze card error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to freeze card")

@app.post("/api/v1/cards/{card_id}/unfreeze")
async def unfreeze_card_direct(
    card_id: str,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Unfreeze a card."""
    try:
        user_id = get_current_user_id(credentials)
        from shared.models.card import Card, CardStatus
        
        card = db.query(Card).filter(Card.id == card_id, Card.user_id == user_id).first()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        card.status = CardStatus.ACTIVE
        db.commit()
        
        return {"message": "Card unfrozen successfully", "status": card.status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unfreeze card error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to unfreeze card")

@app.get("/api/v1/cards/{card_id}/cvv")
async def get_card_cvv_direct(
    card_id: str,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get card CVV (decrypted)."""
    try:
        user_id = get_current_user_id(credentials)
        from shared.models.card import Card
        from shared.utils.encryption import decrypt_value
        
        card = db.query(Card).filter(Card.id == card_id, Card.user_id == user_id).first()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        # Decrypt CVV
        cvv = decrypt_value(card.cvv_hash)
        
        return {"cvv": cvv}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get CVV error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve CVV")

@app.delete("/api/v1/cards/{card_id}")
async def delete_card_direct(
    card_id: str,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Delete a card."""
    try:
        user_id = get_current_user_id(credentials)
        from shared.models.card import Card
        from shared.models.wallet import Wallet
        
        card = db.query(Card).filter(Card.id == card_id, Card.user_id == user_id).first()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        # If card has balance, refund to wallet
        if float(card.balance) > 0:
            wallet = db.query(Wallet).filter(
                Wallet.user_id == user_id,
                Wallet.currency == card.currency
            ).first()
            
            if wallet:
                wallet.balance = float(wallet.balance) + float(card.balance)
        
        db.delete(card)
        db.commit()
        
        return {"message": "Card deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete card error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete card")


@app.api_route("/api/v1/crypto/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def crypto_proxy(path: str, request: Request):
    """Proxy requests to crypto service."""
    return await forward_request("crypto", f"/api/v1/crypto/{path}", request.method, request)


# Travel routes
@app.api_route("/api/v1/travel/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def travel_proxy(path: str, request: Request):
    """Proxy requests to travel service."""
    return await forward_request("travel", f"/api/v1/travel/{path}", request.method, request)


# Rewards routes
@app.api_route("/api/v1/rewards/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def rewards_proxy(path: str, request: Request):
    """Proxy requests to rewards service."""
    return await forward_request("rewards", f"/api/v1/rewards/{path}", request.method, request)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_gateway_host if hasattr(settings, 'api_gateway_host') else "0.0.0.0",
        port=settings.api_gateway_port if hasattr(settings, 'api_gateway_port') else 8000,
        reload=settings.debug
    )

