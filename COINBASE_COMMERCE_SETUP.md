# 🔐 Coinbase Commerce Setup - REAL Crypto Deposits

## ⚠️ WHY THIS IS CRITICAL

**THE PROBLEM WITH THE OLD SYSTEM:**
- ❌ Generated fake addresses that we don't control
- ❌ Users sending crypto = **MONEY LOST FOREVER**
- ❌ No private keys = can't access funds
- ❌ No deposit detection = can't credit balances

**THE SOLUTION: Coinbase Commerce**
- ✅ **Coinbase controls the wallets** (secure custody)
- ✅ **Automatic deposit detection** via webhooks
- ✅ **You receive the crypto** in your Coinbase account
- ✅ **Easy API integration** (we've done it!)
- ✅ **Free for first $10M** in transactions

---

## 🚀 SETUP STEPS (10 Minutes)

### Step 1: Create Coinbase Commerce Account

1. Go to: **https://commerce.coinbase.com/signup**
2. Click **"Get Started"**
3. Sign up with your email
4. Verify your email address
5. Complete the onboarding form:
   - Business name: "BenGo" (or your company name)
   - Website: Your website URL (or use http://localhost:3000 for testing)
   - What are you selling: "Digital Wallet Services"

### Step 2: Get Your API Key

1. Login to Coinbase Commerce Dashboard
2. Click on **Settings** (gear icon in sidebar)
3. Scroll to **API Keys** section
4. Click **"Create an API Key"**
5. Give it a name: "BenGo Production"
6. Copy the API key (it looks like: `a1b2c3d4-1234-5678-9abc-def012345678`)
7. **SAVE IT SECURELY** - you can't see it again!

### Step 3: Get Your Webhook Shared Secret

1. Still in **Settings** page
2. Scroll to **Webhook Subscriptions**
3. Click **"Add an endpoint"**
4. Enter webhook URL:
   - For local testing: `https://your-ngrok-url/api/v1/crypto/deposit/webhook`
   - For production: `https://your-domain.com/api/v1/crypto/deposit/webhook`
5. Click **"Show shared secret"**
6. Copy the secret (looks like: `abcdef123456...`)

**Note:** For local testing, you need **ngrok** to expose your localhost:
```bash
# Install ngrok: https://ngrok.com/download
# Run: ngrok http 8000
# Use the https URL it gives you
```

### Step 4: Add to Your `.env` File

Open `backend/.env` and add these lines:

```env
# Coinbase Commerce Configuration
COINBASE_COMMERCE_API_KEY=your_api_key_here
COINBASE_COMMERCE_WEBHOOK_SECRET=your_webhook_secret_here
```

Example:
```env
COINBASE_COMMERCE_API_KEY=a1b2c3d4-1234-5678-9abc-def012345678
COINBASE_COMMERCE_WEBHOOK_SECRET=abcdef123456789...
```

### Step 5: Restart Your Backend

```powershell
cd backend
py start_server.py
```

---

## ✅ TESTING (Make Sure It Works!)

### Test the Integration:

1. Go to **http://localhost:3000**
2. Login to your BenGo account
3. Click **Dashboard**
4. Click **"Deposit Crypto"** card
5. Select a cryptocurrency (BTC/ETH/USDT)
6. Click **"Continue"**
7. Enter amount: `₦5000` (or any amount ≥ ₦1,000)
8. Click **"Generate Address"**

**What Should Happen:**
- ✅ You see a deposit address
- ✅ You see a QR code
- ✅ You see a "Open Coinbase Payment Page" button

### Test a Real Deposit (Small Amount!):

1. Click **"Open Coinbase Payment Page"**
2. This opens Coinbase's hosted payment page
3. Select your cryptocurrency
4. Send a **SMALL TEST** amount (e.g., $1 worth)
5. Wait for blockchain confirmation (3-15 minutes)
6. Your BenGo wallet should be credited automatically!

**Recommended Test Amounts:**
- **USDT**: $1-5 (fastest, cheapest fees)
- **ETH**: $5-10 (moderate fees)
- **BTC**: $10-20 (slower, higher fees)

---

## 🔍 HOW IT WORKS

```
User clicks "Deposit Crypto"
         ↓
User enters amount (₦5,000)
         ↓
Backend calls Coinbase Commerce API
         ↓
Coinbase generates unique deposit address
         ↓
User sends crypto to that address
         ↓
Blockchain confirms transaction
         ↓
Coinbase sends webhook to your backend
         ↓
Backend credits user's NGN wallet
         ↓
User sees balance updated ✅
```

---

## 💰 PRICING & FEES

**Coinbase Commerce Fees:**
- **Free** for first **$10 million** in transaction volume
- After $10M: **1% fee** on transactions

**Blockchain Fees:**
- User pays blockchain network fees (gas)
- You don't pay anything extra

**Currency Conversion:**
- Crypto is auto-converted to NGN in your system
- User's wallet is credited in NGN

---

## 🛡️ SECURITY

**What's Secure:**
- ✅ Coinbase holds all private keys
- ✅ Your backend never touches private keys
- ✅ Webhook signature verification
- ✅ HTTPS required for webhooks

**Best Practices:**
1. **Never** commit `.env` file to Git
2. **Use different API keys** for dev/production
3. **Enable 2FA** on your Coinbase Commerce account
4. **Monitor deposits** regularly in Coinbase dashboard

---

## 📊 MONITORING DEPOSITS

### In Coinbase Commerce Dashboard:

1. Go to **https://commerce.coinbase.com**
2. Click **"Payments"**
3. See all deposit history:
   - Pending
   - Completed
   - Expired
   - Failed

### In Your BenGo Backend:

Check `crypto_transactions` table:
```sql
SELECT * FROM crypto_transactions 
WHERE status = 'PENDING' 
ORDER BY created_at DESC;
```

---

## 🐛 TROUBLESHOOTING

### "Coinbase Commerce is not configured"

**Solution:**
- Make sure you added API keys to `.env`
- Restart backend after adding keys
- Check key format (should be UUID format)

### Webhook not receiving payments

**Solution:**
1. Check webhook URL in Coinbase settings
2. For local testing, use **ngrok**:
   ```bash
   ngrok http 8000
   ```
3. Update webhook URL to your ngrok HTTPS URL
4. Verify webhook secret matches your `.env`

### Payment confirmed but wallet not credited

**Solution:**
1. Check backend logs for webhook errors
2. Verify `user_id` is in webhook metadata
3. Check `crypto_transactions` table for status
4. Manually credit if needed (contact support)

### Testing with Testnet (Recommended!)

For development, use **Coinbase Commerce Testnet:**
1. Go to: https://beta.commerce.coinbase.com
2. Create testnet account
3. Use testnet API key in `.env`
4. Get free testnet crypto from faucets
5. Test without risking real money!

---

## 🚀 PRODUCTION CHECKLIST

Before going live:

- [ ] Created Coinbase Commerce account
- [ ] Got Production API key (not testnet!)
- [ ] Added API key to `.env`
- [ ] Set up webhook with production URL
- [ ] Tested with small real deposit ($1-5)
- [ ] Verified auto-crediting works
- [ ] Enabled 2FA on Coinbase Commerce
- [ ] Set up monitoring/alerts
- [ ] Documented process for support team

---

## 💡 ALTERNATIVE OPTIONS

If you don't want to use Coinbase Commerce:

### Option 1: BitPay
- Similar to Coinbase Commerce
- More business-focused
- Website: https://bitpay.com

### Option 2: NOWPayments
- Supports 200+ cryptocurrencies
- More customization
- Website: https://nowpayments.io

### Option 3: Build Your Own
- **NOT RECOMMENDED** for production
- Requires:
  - Private key management (HSM/KMS)
  - Blockchain node infrastructure
  - Security audits
  - Regulatory compliance
  - 24/7 monitoring

---

## 📞 SUPPORT

**Coinbase Commerce Support:**
- Help Center: https://commerce.coinbase.com/help
- Email: commerce@coinbase.com
- Status Page: https://status.coinbase.com

**BenGo Technical Support:**
- Check `backend/api_gateway/main.py` for implementation
- Check `web/src/components/DepositCryptoModal.tsx` for UI
- Review logs in backend console

---

## 🎉 YOU'RE ALL SET!

Once you add your Coinbase Commerce API keys:
1. Users can deposit **real crypto**
2. Funds go to **your Coinbase account**
3. Balances are **credited automatically**
4. **No money loss** - everything is secure!

**Next Steps:**
1. Sign up for Coinbase Commerce
2. Add API keys to `.env`
3. Test with small amount
4. Start accepting deposits! 🚀

---

**🔐 Remember: NEVER commit your `.env` file to Git!**
