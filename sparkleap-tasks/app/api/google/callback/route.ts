import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state') || 'calendar';

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      const redirectUrl = state === 'sheets' ? '/' : '/calendar';
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}${redirectUrl}?auth=error&message=${encodeURIComponent(error)}`
      );
    }

    // Check for authorization code
    if (!code) {
      const redirectUrl = state === 'sheets' ? '/' : '/calendar';
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}${redirectUrl}?auth=error&message=No authorization code`
      );
    }

    // Exchange code for tokens
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    // Validate tokens
    if (!tokens.access_token) {
      const redirectUrl = state === 'sheets' ? '/' : '/calendar';
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}${redirectUrl}?auth=error&message=Failed to get access token`
      );
    }

    // Prepare credentials object
    const credentials = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      scope: tokens.scope,
      tokenType: tokens.token_type,
    };

    // TODO: In production, store tokens securely in database
    // For now, we'll pass them via URL (not ideal for production)
    // In production: 
    // 1. Store tokens in database with user ID
    // 2. Return only a session token or user ID
    // 3. Fetch tokens from database when needed

    // Redirect based on state
    const redirectUrl = state === 'sheets' ? '/' : '/calendar';
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}${redirectUrl}?auth=success&credentials=${encodeURIComponent(JSON.stringify(credentials))}&source=${state}`
    );

  } catch (error) {
    console.error('Google callback error:', error);
    // Get state from URL again since it might not be in scope
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'calendar';
    const redirectUrl = state === 'sheets' ? '/' : '/calendar';
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}${redirectUrl}?auth=error&message=${encodeURIComponent('Authentication failed')}`
    );
  }
}
