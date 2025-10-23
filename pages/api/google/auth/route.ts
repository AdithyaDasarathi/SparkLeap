import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, COMBINED_SCOPES } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'calendar';
    
    console.log('🔗 Google auth endpoint called with state:', state);
    
    const oauth2Client = getOAuthClient();
    // Force the redirect URI to the new callback to avoid mismatches
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const redirectUri = state === 'sheets' 
      ? `${baseUrl}/api/google/callback` 
      : `${baseUrl}/api/auth/google/callback`;
    
    console.log('🔗 Using redirect URI:', redirectUri);
    // @ts-ignore - redirectUri is a public property on OAuth2Client
    oauth2Client.redirectUri = redirectUri;
    
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: COMBINED_SCOPES,
      state: state
    });
    
    console.log('🔗 Generated auth URL:', url);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('❌ Google auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
