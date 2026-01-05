# Google OAuth Troubleshooting Guide

## Error: "Can't continue with google.com" / "Something went wrong"

This error means your **Authorized JavaScript origins** in Google Cloud Console don't match your current URL.

## 🔍 Step 1: Check Your Current Origin

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Look for messages showing your current origin
4. Or check the address bar - it should show something like:
   - `http://localhost:3000`
   - `http://localhost:3001`
   - `http://localhost:5173`

## 🔧 Step 2: Verify Google Cloud Console Configuration

### Go to Google Cloud Console:
https://console.cloud.google.com/apis/credentials

### Find Your Client ID:
Look for: `454412057562-k8fdjdna6qo623i2lad854ht8ra3k9cj.apps.googleusercontent.com`

### Click "Edit" and check:

#### ✅ Authorized JavaScript origins MUST include:
```
http://localhost:3000
http://localhost:3001
http://localhost:5173
```

**CRITICAL:** The origin must match EXACTLY, including:
- ✅ `http://` (not `https://`)
- ✅ `localhost` (not `127.0.0.1`)
- ✅ The exact port number

#### ❌ Common Mistakes:
- ❌ Adding `http://localhost:8000` (backend - WRONG!)
- ❌ Using `https://` instead of `http://`
- ❌ Using `127.0.0.1` instead of `localhost`
- ❌ Missing the port number
- ❌ Typos in the URL

## 🔧 Step 3: Configure OAuth Consent Screen

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Make sure:
   - **User Type**: External (for testing) or Internal
   - **App name**: Set to something (required)
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **Scopes**: Must include `email`, `profile`, `openid`
   - **Test users**: If in "Testing" mode, add your Google account email

## ⏱️ Step 4: Wait for Changes

- Google changes can take **5-10 minutes** to propagate
- After saving, wait at least 5 minutes
- Clear your browser cache (Ctrl+Shift+Delete)
- Try again

## 🧪 Step 5: Test

1. Open browser console (F12)
2. Click "Sign in with Google"
3. Check console for error messages
4. Look for messages showing:
   - Your current origin
   - Configuration errors
   - Setup instructions

## 📋 Quick Checklist

- [ ] Added `http://localhost:3000` to Authorized JavaScript origins
- [ ] Added `http://localhost:3001` to Authorized JavaScript origins
- [ ] Added `http://localhost:5173` to Authorized JavaScript origins
- [ ] Used `http://` not `https://`
- [ ] Used `localhost` not `127.0.0.1`
- [ ] OAuth Consent Screen is configured
- [ ] Added your email as a test user (if in Testing mode)
- [ ] Waited 5-10 minutes after saving
- [ ] Cleared browser cache
- [ ] Checked browser console for specific errors

## 🆘 Still Not Working?

1. **Check Browser Console**: Look for specific error messages
2. **Verify Client ID**: Make sure it matches exactly in `.env` file
3. **Try Incognito Mode**: Rules out cache/cookie issues
4. **Check Network Tab**: See if requests to Google are being blocked
5. **Verify Origin**: The console will show your exact origin - make sure it matches Google Cloud Console

## 📞 Need More Help?

The browser console (F12) will show detailed error messages with specific instructions on what to fix.

