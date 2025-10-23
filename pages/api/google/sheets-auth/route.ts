import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, COMBINED_SCOPES } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    console.log('🔗 Google Sheets auth endpoint called');
    console.log('🔧 Environment variables:', {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasGoogleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL
    });
    
    const oauth2Client = getOAuthClient();
    
    // Override the redirect URI for sheets
    const sheetsRedirectUri = `${process.env.NEXTAUTH_URL}/api/google/sheets-callback`;
    console.log('🔗 Sheets redirect URI:', sheetsRedirectUri);
    oauth2Client.redirectUri = sheetsRedirectUri;
    
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: COMBINED_SCOPES,
      state: "sheets" // Add state to identify this as sheets auth
    });
    
    console.log('🔗 Generated auth URL:', url);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('❌ Google Sheets auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
