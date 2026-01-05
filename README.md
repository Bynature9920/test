# Fintech Super App

A comprehensive financial platform designed to make everyday financial activities easier for students, freelancers, and travelers, with an initial focus on Nigeria and global scalability.

## Overview

This fintech super app provides a single, secure platform where users can:
- Manage money with Naira (NGN) wallets
- Make instant P2P transfers
- Fund accounts with crypto (BTC, USDT, ETH)
- Convert crypto to local currency
- Send money to Nigerian bank accounts
- Access virtual debit cards
- Apply for micro-loans
- Book travel services
- Earn rewards

## Architecture

### Tech Stack
- **Web App**: React + TypeScript (Vite)
- **Mobile App**: Flutter (cross-platform)
- **Backend**: Python (FastAPI microservices)
- **Database**: MySQL
- **Architecture**: Microservices with API Gateway

### Service Architecture

```
┌─────────────────┐
│   API Gateway   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│ Core │ │ Domain  │
│Services│ │Services │
└───────┘ └─────────┘
```

#### Core Services
- **Auth Service**: Authentication, authorization, KYC/AML
- **Wallet & Ledger Service**: Double-entry accounting, balance management
- **Payments Service**: P2P transfers, bank transfers
- **Cards Service**: Virtual debit card management
- **Loans Service**: Micro-loan processing

#### Domain Services
- **Crypto Service**: Crypto funding, conversion, balance management
- **Travel Service**: Flight and hotel bookings
- **Rewards Service**: Cashback and points system
- **Risk & Fraud Service**: Transaction monitoring, fraud detection

## Project Structure

```
fintech-super-app/
├── backend/
│   ├── api-gateway/
│   ├── services/
│   │   ├── auth/
│   │   ├── wallet/
│   │   ├── payments/
│   │   ├── cards/
│   │   ├── loans/
│   │   ├── crypto/
│   │   ├── travel/
│   │   ├── rewards/
│   │   └── risk/
│   ├── shared/
│   └── database/
├── web/
│   └── (React web application)
├── mobile/
│   └── flutter_app/
├── docs/
└── scripts/
```

## Getting Started

### Prerequisites
- Python 3.9+
- MySQL 8.0+
- Flutter SDK 3.0+
- Docker (optional, for containerized deployment)

### Backend Setup

1. Create virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
python scripts/migrate.py
```

5. Start services:
```bash
# Start API Gateway
python -m api_gateway.main

# Start individual services (in separate terminals)
python -m services.auth.main
python -m services.wallet.main
# ... etc
```

### Web App Setup

1. Install dependencies:
```bash
cd web
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API base URL if needed
```

3. Start development server:
```bash
npm run dev
# The app will be available at http://localhost:3000
```

### Mobile App Setup

1. Install Flutter dependencies:
```bash
cd mobile/flutter_app
flutter pub get
```

2. Configure environment:
```bash
cp lib/config/env.example.dart lib/config/env.dart
# Edit with your API endpoints
```

3. Run the app:
```bash
flutter run
```

## Security & Compliance

- **KYC/AML**: Comprehensive identity verification
- **Encryption**: End-to-end encryption for sensitive data
- **Audit Trail**: Complete transaction logging
- **Double-Entry Accounting**: Financial accuracy and auditability
- **Partner-Based Crypto Custody**: Secure crypto handling

## Development Guidelines

- Follow PEP 8 for Python code
- Use type hints for all functions
- Write unit tests for all services
- Document all APIs with OpenAPI/Swagger
- Follow Flutter best practices for mobile app

## License

Proprietary - All rights reserved

