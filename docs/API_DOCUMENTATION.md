# API Documentation

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://api.fintechsuperapp.com`

## Authentication

All protected endpoints require a JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Common Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message",
  "status": "success"
}
```

### Error Response
```json
{
  "error": "Error message",
  "status": "error",
  "code": "ERROR_CODE"
}
```

## Authentication Endpoints

### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "phone": "+2348012345678",
  "first_name": "John",
  "last_name": "Doe",
  "country_code": "NG"
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh
Authorization: Bearer <refresh_token>
```

## Wallet Endpoints

### Get Balance
```http
GET /api/v1/wallet/balance?currency=NGN
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "currency": "NGN",
  "available_balance": "10000.00",
  "pending_balance": "500.00",
  "total_balance": "10500.00"
}
```

### Get All Balances
```http
GET /api/v1/wallet/balances
Authorization: Bearer <access_token>
```

## Payments Endpoints

### P2P Transfer
```http
POST /api/v1/payments/p2p
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "recipient_id": "user_id_123",
  "amount": "1000.00",
  "currency": "NGN",
  "description": "Payment for services"
}
```

### Bank Transfer
```http
POST /api/v1/payments/bank-transfer
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "account_number": "1234567890",
  "bank_code": "058",
  "account_name": "John Doe",
  "amount": "5000.00",
  "currency": "NGN",
  "description": "Transfer to bank account"
}
```

### Tuition Payment
```http
POST /api/v1/payments/tuition
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "institution_id": "inst_123",
  "student_id": "STU123456",
  "amount": "50000.00",
  "currency": "NGN",
  "description": "Tuition fee payment"
}
```

## Crypto Endpoints

### Get Crypto Balances
```http
GET /api/v1/crypto/balances
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "balances": [
    {
      "currency": "BTC",
      "balance": "0.00100000",
      "ngn_value": "50000.00"
    },
    {
      "currency": "USDT",
      "balance": "100.00000000",
      "ngn_value": "150000.00"
    }
  ]
}
```

### Fund Account with Crypto
```http
POST /api/v1/crypto/fund
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "crypto_currency": "USDT",
  "amount": "100.00"
}
```

**Response:**
```json
{
  "transaction_id": "crypto_txn_123",
  "wallet_address": "0x1234...",
  "status": "pending",
  "message": "Fund your account by sending crypto to the provided address"
}
```

### Convert Crypto to Naira
```http
POST /api/v1/crypto/convert
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "from_currency": "USDT",
  "amount": "100.00"
}
```

**Response:**
```json
{
  "conversion_id": "conv_123",
  "from_currency": "USDT",
  "to_currency": "NGN",
  "from_amount": "100.00",
  "to_amount": "150000.00",
  "exchange_rate": "1500.00",
  "status": "PROCESSING"
}
```

### Get Exchange Rates
```http
GET /api/v1/crypto/rates
```

**Response:**
```json
{
  "rates": {
    "BTC": "50000000.00",
    "USDT": "1500.00",
    "ETH": "2000000.00"
  },
  "last_updated": "2024-01-01T00:00:00Z"
}
```

## Cards Endpoints

### Create Virtual Card
```http
POST /api/v1/cards/create
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "card_type": "VIRTUAL",
  "currency": "NGN",
  "cardholder_name": "John Doe"
}
```

**Response:**
```json
{
  "card_id": "card_123",
  "card_number": "**** **** **** 1234",
  "cardholder_name": "John Doe",
  "expiry_month": 12,
  "expiry_year": 2025,
  "cvv": "123",
  "card_type": "VIRTUAL",
  "status": "ACTIVE",
  "currency": "NGN",
  "balance": "0.00"
}
```

### Get User Cards
```http
GET /api/v1/cards
Authorization: Bearer <access_token>
```

### Fund Card
```http
POST /api/v1/cards/{card_id}/fund
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": "5000.00",
  "currency": "NGN"
}
```

## Loans Endpoints

### Apply for Loan
```http
POST /api/v1/loans/apply
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": "10000.00",
  "purpose": "Emergency expenses",
  "repayment_period_days": 30
}
```

**Response:**
```json
{
  "loan_id": "loan_123",
  "user_id": "user_123",
  "amount": "10000.00",
  "interest_rate": "5.0",
  "total_amount": "10500.00",
  "status": "PENDING",
  "application_date": "2024-01-01T00:00:00Z"
}
```

### Check Eligibility
```http
GET /api/v1/loans/eligibility
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "eligible": true,
  "max_amount": 50000,
  "interest_rate": "5.0",
  "credit_score": 750
}
```

### Repay Loan
```http
POST /api/v1/loans/{loan_id}/repay
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": "10500.00"
}
```

## Travel Endpoints

### Search Flights
```http
GET /api/v1/travel/flights/search?origin=LOS&destination=ABJ&departure_date=2024-02-01&passengers=1
Authorization: Bearer <access_token>
```

### Search Hotels
```http
GET /api/v1/travel/hotels/search?location=Lagos&check_in=2024-02-01&check_out=2024-02-05&guests=2
Authorization: Bearer <access_token>
```

### Create Booking
```http
POST /api/v1/travel/book
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "booking_type": "FLIGHT",
  "booking_reference": "FL123456",
  "amount": "50000.00",
  "currency": "NGN"
}
```

## Rewards Endpoints

### Get Rewards Balance
```http
GET /api/v1/rewards/balance
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "cashback_balance": "500.00",
  "points_balance": 1000,
  "total_cashback_earned": "2500.00",
  "total_points_earned": 5000
}
```

### Redeem Reward
```http
POST /api/v1/rewards/redeem
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reward_type": "CASHBACK",
  "amount": "500.00"
}
```

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limiting

- **Standard**: 100 requests per minute
- **Authenticated**: 1000 requests per minute
- **Premium Users**: 5000 requests per minute

## Pagination

List endpoints support pagination:

```
GET /api/v1/endpoint?page=1&limit=20
```

**Response:**
```json
{
  "data": [...],
  "page": 1,
  "limit": 20,
  "total": 100,
  "total_pages": 5
}
```

