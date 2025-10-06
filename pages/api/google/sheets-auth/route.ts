import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, COMBINED_SCOPES } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const oauth2Client = getOAuthClient();
    
    // Override the redirect URI for sheets
    const sheetsRedirectUri = `${process.env.NEXTAUTH_URL}/api/google/sheets-callback`;
    oauth2Client.redirectUri = sheetsRedirectUri;
    
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: COMBINED_SCOPES,
      state: "sheets" // Add state to identify this as sheets auth
    });
    
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Google Sheets auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
