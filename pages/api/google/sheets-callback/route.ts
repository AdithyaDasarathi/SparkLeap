import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?auth=error&message=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?auth=error&message=${encodeURIComponent('No authorization code received')}`
      );
    }

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?auth=error&message=${encodeURIComponent('No access token received')}`
      );
    }

    const credentials = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    };

    // Redirect to the main page with credentials for sheets
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?auth=success&credentials=${encodeURIComponent(JSON.stringify(credentials))}&source=sheets`
    );
  } catch (error) {
    console.error('Google Sheets callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?auth=error&message=${encodeURIComponent('Authentication failed')}`
    );
  }
}
