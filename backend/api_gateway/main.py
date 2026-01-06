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
from datetime import datetime, timedelta
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
            kyc_status=KYCStatus.PENDING,
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
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
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
                    kyc_status=KYCStatus.PENDING,
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
        
        # Always return success (security: don't reveal if email exists)
        if not user:
            logger.warning(f"Password reset requested for non-existent email: {request.email}")
            return {"message": "If the email exists, a password reset link has been sent."}
        
        # Check if user has password (OAuth users can't reset password)
        if not user.password_hash:
            logger.warning(f"Password reset requested for OAuth user: {request.email}")
            return {"message": "If the email exists, a password reset link has been sent."}
        
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
        if not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
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
        pending_kyc = db.query(User).filter(
            (User.kyc_status == KYCStatus.PENDING) | 
            (User.kyc_status == KYCStatus.IN_PROGRESS)
        ).count()
        
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
            sender = db.query(User).filter(User.id == txn.sender_id).first() if txn.sender_id else None
            recipient = db.query(User).filter(User.id == txn.recipient_id).first() if txn.recipient_id else None
            
            result.append({
                "transaction_id": str(txn.id),
                "sender_id": str(txn.sender_id) if txn.sender_id else None,
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


# Wallet routes
@app.api_route("/api/v1/wallet/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def wallet_proxy(path: str, request: Request):
    """Proxy requests to wallet service."""
    return await forward_request("wallet", f"/api/v1/wallet/{path}", request.method, request)


# Payments routes
@app.api_route("/api/v1/payments/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def payments_proxy(path: str, request: Request):
    """Proxy requests to payments service."""
    return await forward_request("payments", f"/api/v1/payments/{path}", request.method, request)


# Cards routes
@app.api_route("/api/v1/cards/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def cards_proxy(path: str, request: Request):
    """Proxy requests to cards service."""
    return await forward_request("cards", f"/api/v1/cards/{path}", request.method, request)


# Loans routes
@app.api_route("/api/v1/loans/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def loans_proxy(path: str, request: Request):
    """Proxy requests to loans service."""
    return await forward_request("loans", f"/api/v1/loans/{path}", request.method, request)


# Crypto routes
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

