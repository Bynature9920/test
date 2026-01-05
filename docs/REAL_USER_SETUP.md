# Setting Up Real User Registration

This guide explains how to enable real user registration (not just demo mode) for the Fintech Super App.

## Current Status

The app currently runs in **demo mode** by default, which means:
- Users can sign up and login without a backend
- User data is stored in browser localStorage
- All transactions are simulated

For **real users** to sign up, you need to:
1. Set up and run the backend server
2. Configure the database
3. Complete the backend registration implementation
4. Configure the frontend to connect to the backend

## Prerequisites

- Python 3.9+
- MySQL 8.0+
- Node.js 18+ (for web app)
- MySQL server running and accessible

## Step 1: Backend Setup

### 1.1 Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 1.2 Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Database Configuration
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/fintech_db

# JWT Secret Keys (generate strong random strings)
JWT_SECRET_KEY=your-super-secret-jwt-key-here-min-32-chars
JWT_REFRESH_SECRET_KEY=your-super-secret-refresh-key-here-min-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# API Gateway
API_GATEWAY_HOST=0.0.0.0
API_GATEWAY_PORT=8000

# CORS (for web app)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Environment
ENVIRONMENT=development
```

**Important**: Replace `username`, `password`, and database name with your MySQL credentials.

### 1.3 Create Database

```sql
CREATE DATABASE fintech_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 1.4 Run Database Migrations

```bash
cd backend
python scripts/migrate.py
```

This will create all necessary database tables.

### 1.5 Complete Backend Registration Implementation

The registration endpoint in `backend/services/auth/main.py` currently has TODOs. You need to:

1. **Import the User model**:
```python
from shared.models.user import User
```

2. **Complete the registration function**:
```python
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
    
    # TODO: Create KYC record
    # TODO: Send verification email
    
    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        phone=new_user.phone,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        kyc_status=new_user.kyc_status.value,
        is_active=new_user.is_active
    )
```

3. **Complete the login function** similarly to verify passwords against the database.

### 1.6 Start Backend Services

Start the API Gateway (which routes to all services):

```bash
cd backend
python -m api_gateway.main
```

The API should be available at `http://localhost:8000`

You can verify it's working by visiting:
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

## Step 2: Frontend Configuration

### 2.1 Configure API URL

The frontend is already configured to connect to `http://localhost:8000` by default (see `web/vite.config.ts`).

If your backend is running on a different URL, create a `.env` file in the `web/` directory:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 2.2 Start Web App

```bash
cd web
npm install
npm run dev
```

The web app will be available at `http://localhost:3000`

## Step 3: Test Real Registration

1. **Open the web app** at `http://localhost:3000`
2. **Click "Sign up"** or navigate to `/register`
3. **Fill in the registration form**:
   - First Name
   - Last Name
   - Email (must be unique)
   - Phone Number (Nigerian format: +2348012345678)
   - Password (minimum 6 characters)
4. **Submit the form**

If the backend is running and configured correctly:
- The registration will be sent to the backend API
- User will be created in the MySQL database
- You'll be automatically logged in
- You'll be redirected to the dashboard

If the backend is not running or there's an error:
- The app will fall back to demo mode
- User data will be stored in localStorage
- You'll see a console warning about API failure

## Step 4: Verify Registration

### Check Database

```sql
USE fintech_db;
SELECT * FROM users;
```

You should see the newly registered user with:
- Hashed password (not plain text)
- Unique email and phone
- KYC status = 'PENDING'
- is_active = 1

### Check Backend Logs

The backend should log:
- Registration request received
- User created successfully
- JWT tokens generated

## Troubleshooting

### Issue: "Network Error" or "API failed"

**Solution**: 
- Ensure backend is running on port 8000
- Check `http://localhost:8000/health` in browser
- Verify CORS settings in backend allow `http://localhost:3000`

### Issue: "Database connection failed"

**Solution**:
- Verify MySQL is running: `mysql -u username -p`
- Check DATABASE_URL in `.env` file
- Ensure database exists: `SHOW DATABASES;`

### Issue: "Invalid phone number format"

**Solution**:
- Use Nigerian format: `+2348012345678` or `08012345678`
- Phone must be 10-15 digits

### Issue: "Email already exists"

**Solution**:
- This is expected if email is already registered
- Use a different email or check database for existing user

## Production Deployment

For production, you'll need to:

1. **Use a production database** (not localhost)
2. **Set up SSL/HTTPS** for secure connections
3. **Configure production CORS** origins
4. **Use environment-specific secrets**
5. **Set up email service** for verification emails
6. **Configure proper logging and monitoring**
7. **Set up reverse proxy** (nginx) for the API Gateway
8. **Use a process manager** (PM2, systemd) to keep services running

## Next Steps

After enabling real registration:

1. **Complete KYC implementation** - Add identity verification
2. **Add email verification** - Send verification emails on signup
3. **Implement password reset** - Allow users to reset forgotten passwords
4. **Add 2FA** - Two-factor authentication for security
5. **Set up monitoring** - Track registrations, errors, and performance

## Support

If you encounter issues:
1. Check backend logs for errors
2. Check browser console for frontend errors
3. Verify database connection
4. Ensure all environment variables are set correctly




