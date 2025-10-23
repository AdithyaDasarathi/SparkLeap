# Google OAuth Redirect URI Fix

## Issue
You're getting "Error 400: redirect_uri_mismatch" when trying to connect Google Sheets.

## Solution
You need to add the correct redirect URI to your Google Cloud Console.

### Steps to Fix:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to OAuth Settings**
   - Go to "APIs & Services" → "Credentials"
   - Find your OAuth 2.0 Client ID
   - Click the edit (pencil) icon

3. **Add Redirect URIs**
   Add these URIs to the "Authorized redirect URIs" section:
   ```
   http://localhost:3000/api/google-sheets-callback
   https://sparkleap.ai/api/google-sheets-callback
   ```

4. **Save Changes**
   - Click "Save" at the bottom

5. **Test Again**
   - Try connecting Google Sheets again
   - The OAuth flow should now work

## Alternative: Use CSV Import
If you continue having OAuth issues, you can use the "Quick Import as CSV" button instead:
1. Export your Google Sheets data as CSV
2. Use the "Quick Import as CSV" button
3. This bypasses OAuth entirely

## Current Redirect URIs Being Used:
- **Development**: `http://localhost:3000/api/google-sheets-callback`
- **Production**: `https://sparkleap.ai/api/google-sheets-callback`
