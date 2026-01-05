# Architecture Documentation

## System Overview

The Fintech Super App is built using a microservices architecture with a clear separation of concerns. The system is designed for scalability, security, and compliance.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Flutter)                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS/REST API
                     │
┌────────────────────▼────────────────────────────────────┐
│                  API Gateway (Port 8000)                │
│  - Request Routing                                      │
│  - CORS Management                                      │
│  - Request Forwarding                                   │
└────┬────┬────┬────┬────┬────┬────┬────┬────┬───────────┘
     │    │    │    │    │    │    │    │    │
     │    │    │    │    │    │    │    │    │
┌────▼──┐┌▼───┐┌───▼┐┌───▼┐┌───▼┐┌───▼┐┌───▼┐┌───▼┐┌───▼┐
│ Auth  ││Wall││Pay ││Card││Loan││Cry ││Trav││Rew ││Risk│
│ 8001  ││et  ││ment││s   ││s   ││pto ││el  ││ards││    │
│       ││8002││8003││8004││8005││8006││8007││8008││8009│
└───┬───┘└──┬─┘└───┬┘└───┬┘└───┬┘└───┬┘└───┬┘└───┬┘└───┬┘
    │       │      │     │     │     │     │     │     │
    └───────┴──────┴─────┴─────┴─────┴─────┴─────┴─────┘
                          │
                          │
              ┌───────────▼───────────┐
              │    MySQL Database     │
              │  - Users              │
              │  - Wallets            │
              │  - Transactions       │
              │  - Ledger Entries     │
              │  - Crypto Balances    │
              │  - Cards              │
              │  - Loans              │
              │  - Rewards            │
              │  - Travel Bookings    │
              │  - KYC Records        │
              └───────────────────────┘
```

## Service Architecture

### Core Services

#### 1. Auth Service (Port 8001)
- **Responsibilities:**
  - User registration and authentication
  - JWT token generation and validation
  - KYC verification initiation
  - User profile management
  
- **Key Endpoints:**
  - `POST /api/v1/auth/register` - Register new user
  - `POST /api/v1/auth/login` - User login
  - `POST /api/v1/auth/refresh` - Refresh access token
  - `GET /api/v1/auth/me` - Get current user
  - `POST /api/v1/auth/kyc/verify` - Initiate KYC

#### 2. Wallet Service (Port 8002)
- **Responsibilities:**
  - Wallet creation and management
  - Balance tracking
  - Double-entry ledger management
  - Transaction history
  
- **Key Endpoints:**
  - `GET /api/v1/wallet/balance` - Get wallet balance
  - `GET /api/v1/wallet/balances` - Get all balances
  - `POST /api/v1/wallet/create` - Create wallet
  - `GET /api/v1/wallet/transactions` - Get transactions
  - `POST /api/v1/wallet/ledger/entry` - Create ledger entry

#### 3. Payments Service (Port 8003)
- **Responsibilities:**
  - P2P transfers
  - Bank transfers
  - Tuition payments
  - Payment processing
  
- **Key Endpoints:**
  - `POST /api/v1/payments/p2p` - P2P transfer
  - `POST /api/v1/payments/bank-transfer` - Bank transfer
  - `POST /api/v1/payments/tuition` - Tuition payment
  - `GET /api/v1/payments/{id}` - Get payment details

#### 4. Cards Service (Port 8004)
- **Responsibilities:**
  - Virtual debit card creation
  - Card management (block/unblock)
  - Card funding
  - Card transaction history
  
- **Key Endpoints:**
  - `POST /api/v1/cards/create` - Create card
  - `GET /api/v1/cards` - Get user cards
  - `POST /api/v1/cards/{id}/fund` - Fund card
  - `POST /api/v1/cards/{id}/block` - Block card

#### 5. Loans Service (Port 8005)
- **Responsibilities:**
  - Loan application processing
  - Loan eligibility assessment
  - Loan repayment
  - Credit scoring
  
- **Key Endpoints:**
  - `POST /api/v1/loans/apply` - Apply for loan
  - `GET /api/v1/loans` - Get user loans
  - `POST /api/v1/loans/{id}/repay` - Repay loan
  - `GET /api/v1/loans/eligibility` - Check eligibility

### Domain Services

#### 6. Crypto Service (Port 8006)
- **Responsibilities:**
  - Crypto funding (BTC, USDT, ETH)
  - Crypto to Naira conversion
  - Exchange rate management
  - Crypto balance tracking
  
- **Key Endpoints:**
  - `GET /api/v1/crypto/balances` - Get crypto balances
  - `POST /api/v1/crypto/fund` - Fund with crypto
  - `POST /api/v1/crypto/convert` - Convert to Naira
  - `GET /api/v1/crypto/rates` - Get exchange rates

#### 7. Travel Service (Port 8007)
- **Responsibilities:**
  - Flight search and booking
  - Hotel search and booking
  - Booking management
  - Travel payment processing
  
- **Key Endpoints:**
  - `GET /api/v1/travel/flights/search` - Search flights
  - `GET /api/v1/travel/hotels/search` - Search hotels
  - `POST /api/v1/travel/book` - Create booking
  - `GET /api/v1/travel/bookings` - Get bookings

#### 8. Rewards Service (Port 8008)
- **Responsibilities:**
  - Cashback calculation
  - Points management
  - Reward redemption
  - Rewards tier management
  
- **Key Endpoints:**
  - `GET /api/v1/rewards/balance` - Get rewards balance
  - `POST /api/v1/rewards/earn` - Earn reward
  - `POST /api/v1/rewards/redeem` - Redeem reward
  - `GET /api/v1/rewards/tiers` - Get reward tiers

#### 9. Risk & Fraud Service (Port 8009)
- **Responsibilities:**
  - Transaction risk assessment
  - Fraud detection
  - Loan risk assessment
  - User whitelist/blacklist management
  
- **Key Endpoints:**
  - `POST /api/v1/risk/assess` - Assess transaction risk
  - `POST /api/v1/risk/loan-assessment` - Assess loan risk
  - `GET /api/v1/risk/alerts` - Get fraud alerts
  - `POST /api/v1/risk/whitelist` - Whitelist user

## Database Schema

### Core Tables

1. **users** - User accounts and profiles
2. **wallets** - User wallets for different currencies
3. **ledger_entries** - Double-entry accounting ledger
4. **transactions** - All financial transactions
5. **crypto_balances** - Crypto currency balances
6. **crypto_transactions** - Crypto transactions
7. **cards** - Virtual debit cards
8. **card_transactions** - Card payment transactions
9. **loans** - Loan records
10. **loan_repayments** - Loan repayment history
11. **rewards** - Reward records
12. **user_rewards_balances** - User rewards balances
13. **travel_bookings** - Travel booking records
14. **kyc_verifications** - KYC verification records

## Security Architecture

### Authentication & Authorization
- JWT-based authentication
- Access tokens (30 min expiry)
- Refresh tokens (7 days expiry)
- Token refresh mechanism

### Data Security
- Password hashing with bcrypt
- Secure token storage
- Encrypted sensitive data
- HTTPS only in production

### Compliance
- KYC/AML verification
- Transaction monitoring
- Audit trail (ledger entries)
- Sanctioned region checks

## Double-Entry Accounting

All financial transactions use double-entry accounting principles:

- **Debit** = Money going out (decrease in asset)
- **Credit** = Money coming in (increase in asset)

Every transaction has at least one debit and one credit entry, ensuring:
- Financial accuracy
- Complete audit trail
- Balance verification
- Regulatory compliance

## External Integrations

1. **Payment Gateways** - Bank transfers, card processing
2. **Crypto Providers** - Crypto funding and conversion
3. **KYC Providers** - Identity verification
4. **Travel APIs** - Flight and hotel bookings
5. **Card Providers** - Virtual card issuance

## Scalability Considerations

- Microservices architecture allows independent scaling
- Database connection pooling
- Stateless services for horizontal scaling
- Caching layer (Redis) for frequently accessed data
- Async processing for heavy operations

## Deployment

- Each service can be deployed independently
- Containerized with Docker (recommended)
- Load balancing for high availability
- Database replication for read scaling

