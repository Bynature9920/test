# Google OAuth Setup Guide

## The Error: "Can't continue with google.com" / "Something went wrong"

This error occurs when your Google OAuth Client ID is not properly configured in Google Cloud Console.

## Step-by-Step Fix:

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/apis/credentials

### 2. Select Your OAuth 2.0 Client ID
Find the client ID that matches: `454412057562-k8fdjdna6qo623i2lad854ht8ra3k9cj.apps.googleusercontent.com`

### 3. Configure Authorized JavaScript Origins
In the "Authorized JavaScript origins" section, add **ONLY FRONTEND URLs** (where your React app runs):
```
http://localhost:3000
http://localhost:3001
http://localhost:5173
```

**Important:** 
- ✅ Add ALL ports your frontend dev server might use
- ❌ **DO NOT** add backend URLs (like http://localhost:8000) - those are for API calls, not OAuth
- The JavaScript origins are where the Google sign-in JavaScript code runs (your browser)

### 4. Configure Authorized Redirect URIs (if needed)
For ID token flow, you typically don't need redirect URIs, but if you see errors, add:
```
http://localhost:3000
http://localhost:3001
http://localhost:5173
```

**Note:** Again, only frontend URLs here, NOT backend URLs.

### 5. Configure OAuth Consent Screen
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Make sure the consent screen is configured:
   - User Type: External (for testing) or Internal
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: `email`, `profile`, `openid`
   - Test users: Add your Google account email if using "Testing" mode

### 6. Save and Wait
- Save all changes
- Wait 5-10 minutes for changes to propagate
- Clear your browser cache
- Try again

## Current Configuration:
- **Client ID**: `454412057562-k8fdjdna6qo623i2lad854ht8ra3k9cj.apps.googleusercontent.com`
- **Current Origin**: Check browser console for the actual origin being used
- **Dev Server Port**: 3001 (or 3000)

## Troubleshooting:

1. **Check Browser Console**: Open DevTools (F12) and look for Google OAuth errors
2. **Verify Origin**: The origin in the error must match exactly what's in Google Cloud Console
3. **Check Consent Screen**: Make sure it's published or you're added as a test user
4. **Wait for Propagation**: Google changes can take a few minutes to take effect

## Alternative: Use Email/Password
If Google OAuth continues to have issues, users can always use email/password registration and login.

