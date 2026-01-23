# 🔐 Paystack Integration Setup

## Quick Setup (5 minutes)

### 1. Get Your Paystack API Keys

1. Go to [https://paystack.com](https://paystack.com)
2. **Sign up** (it's free!) or **Login**
3. Go to **Settings** → **API Keys & Webhooks**
4. Copy your **Secret Key** (starts with `sk_test_` for test mode)
5. Copy your **Public Key** (starts with `pk_test_` for test mode)

### 2. Add Keys to Your `.env` File

Open `backend/.env` and add these lines:

```env
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
```

**⚠️ IMPORTANT:** 
- Use **TEST keys** (`sk_test_...`) for development
- Use **LIVE keys** (`sk_live_...`) for production
- NEVER commit your `.env` file to Git!

### 3. Configure Paystack Webhook

1. In Paystack Dashboard, go to **Settings** → **API Keys & Webhooks**
2. Click **Add Webhook URL**
3. Enter: `http://your-backend-url/api/v1/wallet/deposit/webhook`
   - For local testing: `https://your-ngrok-url/api/v1/wallet/deposit/webhook` (use ngrok to expose your local backend)
4. Click **Add**

### 4. Restart Your Backend

```powershell
cd backend
py start_server.py
```

---

## Testing Card Payments

### Test Cards (provided by Paystack)

| Card Number         | CVV | PIN  | Expiry | Action         |
|---------------------|-----|------|--------|----------------|
| 4084084084084081    | 408 | 0000 | 12/30  | Success        |
| 5060666666666666666 | 123 | 1234 | 12/30  | Success (Mastercard) |
| 408408408408408408  | 408 | -    | 12/30  | Decline        |

### To Test:

1. Login to your BenGo account
2. Go to **Wallet** → Click **Deposit**
3. Select **💳 Card**
4. Enter amount (e.g., ₦1000)
5. Click **Proceed**
6. You'll be redirected to **Paystack payment page**
7. Enter test card details above
8. Complete payment
9. You'll be redirected back and your wallet will be credited! ✅

---

## How It Works

```
User clicks "Deposit" → Frontend calls Backend
                              ↓
                    Backend initializes Paystack transaction
                              ↓
                    User redirects to Paystack payment page
                              ↓
                    User enters card details & pays
                              ↓
                    Paystack verifies payment
                              ↓
                    Paystack sends webhook to Backend
                              ↓
                    Backend credits user's wallet ✅
```

---

## Bank Transfer Integration

Currently using **hardcoded demo account**. To enable real bank transfers:

1. **Option A: Paystack Dedicated Virtual Accounts**
   - Go to Paystack Dashboard → **Customers** → **Dedicated Virtual Accounts**
   - Enable the feature (requires business verification)
   - Each user gets a unique bank account number

2. **Option B: Manual Verification**
   - Keep the demo account for now
   - Admin verifies bank transfers manually in Admin Panel

---

## Troubleshooting

### "Paystack is not configured" Error
→ Make sure you added `PAYSTACK_SECRET_KEY` to `.env` and restarted backend

### Payment successful but wallet not credited
→ Check that webhook URL is configured correctly in Paystack Dashboard

### "Failed to connect to Paystack"
→ Check your internet connection and Paystack API status

---

## Production Checklist

Before going live:
- [ ] Replace TEST keys with LIVE keys
- [ ] Update webhook URL to production domain
- [ ] Enable HTTPS on your backend
- [ ] Test with real cards (small amounts first!)
- [ ] Set up monitoring for failed webhooks

---

🎉 **You're all set!** Your users can now deposit money using real card payments!
