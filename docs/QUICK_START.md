# Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.9+** - [Download](https://www.python.org/downloads/)
- **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/mysql/)
- **Flutter SDK 3.0+** - [Install Guide](https://docs.flutter.dev/get-started/install)
- **Git** - [Download](https://git-scm.com/downloads)
- **Redis** (Optional, for caching) - [Download](https://redis.io/download)

## Backend Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# Update database URL, JWT secret, API keys, etc.
```

### 4. Set Up Database

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE fintech_db;
EXIT;

# Run migrations
python scripts/create_initial_migration.py "Initial migration"
python scripts/migrate.py
```

### 5. Start Services

You'll need to start each service in a separate terminal:

**Terminal 1 - API Gateway:**
```bash
cd backend
python -m api_gateway.main
```

**Terminal 2 - Auth Service:**
```bash
cd backend
python -m services.auth.main
```

**Terminal 3 - Wallet Service:**
```bash
cd backend
python -m services.wallet.main
```

**Terminal 4 - Payments Service:**
```bash
cd backend
python -m services.payments.main
```

Continue for other services (Cards, Loans, Crypto, Travel, Rewards, Risk).

### Alternative: Use a Process Manager

For easier development, you can use `pm2` or `supervisord` to manage all services:

```bash
# Install pm2
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js
```

## Mobile App Setup

### 1. Install Flutter Dependencies

```bash
cd mobile/flutter_app
flutter pub get
```

### 2. Configure Environment

```bash
# Copy example config
cp lib/config/env.example.dart lib/config/env.dart

# Edit with your API base URL
# Update API_BASE_URL to point to your backend
```

### 3. Run the App

```bash
# For iOS
flutter run -d ios

# For Android
flutter run -d android

# For Web
flutter run -d chrome
```

## Testing the Setup

### 1. Test API Gateway

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy", "gateway": "operational"}
```

### 2. Test Auth Service

```bash
curl http://localhost:8001/health
```

### 3. Register a Test User

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "phone": "+2348012345678",
    "first_name": "Test",
    "last_name": "User",
    "country_code": "NG"
  }'
```

## Development Workflow

### Making Changes

1. **Backend Changes:**
   - Modify service code in `backend/services/{service_name}/`
   - Services auto-reload in development mode
   - Test endpoints using curl or Postman

2. **Database Changes:**
   - Update models in `backend/shared/models/`
   - Create new migration: `python scripts/create_initial_migration.py "Description"`
   - Apply migration: `python scripts/migrate.py`

3. **Mobile App Changes:**
   - Hot reload is enabled: Press `r` in terminal or save file
   - Hot restart: Press `R` in terminal

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Mobile app tests
cd mobile/flutter_app
flutter test
```

## Common Issues

### Database Connection Error

- Ensure MySQL is running
- Check database credentials in `.env`
- Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Port Already in Use

- Change port in `.env` file
- Or kill process using the port:
  ```bash
  # Find process
  lsof -i :8000
  
  # Kill process (replace PID)
  kill -9 <PID>
  ```

### Flutter Dependencies Error

```bash
# Clean and reinstall
cd mobile/flutter_app
flutter clean
flutter pub get
```

### Import Errors in Python

- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`
- Check Python path in IDE settings

## Next Steps

1. **Configure External APIs:**
   - Add payment gateway credentials
   - Set up crypto provider integration
   - Configure KYC provider
   - Add travel API keys

2. **Set Up Production Environment:**
   - Use environment variables for secrets
   - Enable HTTPS
   - Set up database backups
   - Configure monitoring and logging

3. **Implement Business Logic:**
   - Complete TODO items in service files
   - Add database operations
   - Implement external API integrations
   - Add comprehensive error handling

4. **Security Hardening:**
   - Use strong JWT secrets
   - Enable rate limiting
   - Set up firewall rules
   - Implement request validation

## Getting Help

- Check `docs/ARCHITECTURE.md` for system design
- See `docs/API_DOCUMENTATION.md` for API details
- Review service-specific code in `backend/services/`

