# 🚀 NOWPayments Setup Guide for BenGo

## ✅ What You Have Done:
1. ✅ Created NOWPayments account
2. ✅ Generated API key
3. ✅ Code is already integrated!

---

## 🔑 Step 1: Add Your API Key to .env File

1. Open `backend/.env` file
2. Add this line (replace with your actual API key):

```env
NOWPAYMENTS_API_KEY=4ASWCBM-SRQ49Q9-JX4NFW-SF14X68
```

3. **Optional** (for production): Add IPN secret for webhook security:
```env
NOWPAYMENTS_IPN_SECRET=your_ipn_secret_here
```

---

## 💰 Step 2: Add Payout Wallets (Important!)

This is where YOU receive the crypto after customers deposit:

1. Go to https://account.nowpayments.io/
2. Click **Settings** → **Payout wallets**
3. Add your crypto wallet addresses:

   **For Bitcoin (BTC):**
   - If you have Binance: Get your BTC deposit address from Binance
   - If you have Trust Wallet: Get your BTC address
   - If you don't have one: Use Binance or create a Trust Wallet

   **For Ethereum (ETH):**
   - Same process as BTC

   **For USDT:**
   - Choose network: TRC20 (Tron - lowest fees)
   - Get your USDT TRC20 address from Binance/Trust Wallet

---

## 🔗 Step 3: Set Up Webhooks for Production (Optional for Testing)

For production, you need a public URL for webhooks:

1. **Install ngrok** (free):
   ```bash
   # Download from https://ngrok.com/download
   # Or use chocolatey:
   choco install ngrok
   ```

2. **Start ngrok**:
   ```bash
   ngrok http 8000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Update webhook URL in NOWPayments**:
   - Go to NOWPayments → Settings → IPN
   - Enter: `https://abc123.ngrok.io/api/v1/crypto/deposit/webhook`

5. **Update .env** with ngrok URL:
   ```env
   # Update these URLs:
   APP_URL=https://abc123.ngrok.io
   ```

---

## 🎯 Supported Cryptocurrencies

Your app now supports:
- ✅ **Bitcoin (BTC)**
- ✅ **Ethereum (ETH)**
- ✅ **USDT (Tether)** - on TRC20 network (lowest fees)

Plus 200+ other cryptocurrencies supported by NOWPayments!

---

## 💸 How It Works

1. **User clicks "Deposit Crypto"**
2. **Selects currency** (BTC, ETH, or USDT)
3. **Enters amount** in NGN (minimum ₦1,000)
4. **Gets deposit address** from NOWPayments
5. **Sends crypto** to that address
6. **NOWPayments converts** to your payout currency
7. **Your wallet gets credited** automatically
8. **User's BenGo wallet** gets credited in NGN

---

## 🧪 Testing

### Test Mode (Sandbox):
NOWPayments doesn't have a sandbox, but you can test with:
- **Small amounts** (send $1-$5 worth of crypto)
- **Testnet coins** won't work - must use real crypto

### Recommended Testing:
1. Send **$1 worth of USDT** (TRC20) - very cheap fees
2. Check if webhook fires
3. Verify wallet gets credited

---

## 📊 NOWPayments Dashboard

Monitor your crypto deposits:
- **Payments History**: See all incoming payments
- **Balance**: Check your payout balance
- **Withdraw**: Transfer funds to your wallet

---

## 🔒 Security Features

✅ **Webhook verification** - Uses HMAC signature
✅ **Address validation** - Checks crypto addresses
✅ **Amount tracking** - Records all transactions
✅ **Auto-conversion** - Converts crypto to NGN for users

---

## 💡 Fees

**NOWPayments fees:**
- 0.5% per transaction
- Network fees (blockchain fees) paid by customer
- No monthly fees
- No setup fees

**Withdrawal fees:**
- Depends on cryptocurrency
- Usually 0.0005 BTC, 0.005 ETH, 1 USDT

---

## 🚨 Important Notes

1. **Add payout wallets BEFORE going live** - funds will accumulate in NOWPayments
2. **Test with small amounts first**
3. **Keep your API key secret** - never share or commit to git
4. **Monitor the dashboard** regularly
5. **Withdraw regularly** to your personal wallet

---

## 🆘 Troubleshooting

**Problem: "NOWPayments is not configured"**
- Solution: Add `NOWPAYMENTS_API_KEY` to your `.env` file

**Problem: "Service unavailable"**
- Solution: Check your internet connection
- Solution: Verify API key is correct

**Problem: "No address generated"**
- Solution: Check NOWPayments dashboard for errors
- Solution: Ensure you've added at least one payout wallet

**Problem: "Webhook not firing"**
- Solution: Use ngrok for local testing
- Solution: Check IPN settings in NOWPayments dashboard
- Solution: Verify webhook URL is publicly accessible

---

## 📚 Resources

- **NOWPayments Dashboard**: https://account.nowpayments.io/
- **API Documentation**: https://documenter.getpostman.com/view/7907941/S1a32n38
- **Support**: support@nowpayments.io
- **Status Page**: https://status.nowpayments.io/

---

## ✅ Next Steps

1. ✅ Add `NOWPAYMENTS_API_KEY` to `.env`
2. ✅ Restart backend server
3. ✅ Test crypto deposit feature
4. ⏳ Add payout wallets
5. ⏳ Set up ngrok for webhooks (when ready for production)

---

**You're all set! Your crypto deposit feature is ready to use!** 🎉
