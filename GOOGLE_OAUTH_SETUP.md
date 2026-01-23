# Google OAuth Setup Guide

## 🚀 Quick Setup (5 minutes)

Google Sign-in is currently **not configured**. Follow these steps to enable it:

### Step 1: Create Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing one)
3. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
4. Choose **"Web application"**
5. Give it a name (e.g., "BenGo Local Development")

### Step 2: Configure Authorized Origins

Add these URLs to **"Authorized JavaScript origins"**:

```
http://localhost:3000
http://localhost:3001
http://localhost:5173
```

⚠️ **Important**: Use `http://` (not `https://`) and `localhost` (not `127.0.0.1`)

### Step 3: Get Your Client ID

1. Click **"CREATE"**
2. Copy the **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)

### Step 4: Configure Your App

1. Create a file named `.env` in the `web` folder:

```bash
cd web
touch .env  # On Windows: type nul > .env
```

2. Add this content to `web/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=paste-your-client-id-here
```

3. Replace `paste-your-client-id-here` with your actual Client ID

### Step 5: Restart Your App

```bash
# Stop the frontend (Ctrl+C)
# Then restart it
cd web
npm run dev
```

## ✅ Testing

1. Go to the login page
2. Click "Sign in with Google"
3. Select your Google account
4. You should be logged in!

## 🐛 Troubleshooting

### "Google sign-in is not configured"
- Make sure `.env` file exists in the `web` folder
- Check that `VITE_GOOGLE_CLIENT_ID` is set correctly
- Restart your development server

### "Cannot Continue" or "Invalid Client"
- Check that your current URL is added to "Authorized JavaScript origins"
- Wait 5-10 minutes after adding URLs (Google needs time to update)
- Clear browser cache and cookies

### Button does nothing
- Open browser console (F12) and check for errors
- Make sure the Google Identity Services script is loading
- Check that `web/index.html` has: `<script src="https://accounts.google.com/gsi/client" async defer></script>`

## 📚 More Info

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web/guides/overview)
- [OAuth 2.0 Setup Guide](https://support.google.com/cloud/answer/6158849)
